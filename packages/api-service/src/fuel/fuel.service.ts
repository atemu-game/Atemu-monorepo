import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Socket } from 'socket.io';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FuelEvents } from '@app/shared/constants';
import {
  ChainDocument,
  Chains,
  FuelPool,
  FuelPoolDocument,
  JoinFuelPool,
  JoinFuelPoolDocument,
  UserDocument,
} from '@app/shared/models';
import { Model } from 'mongoose';
import { Account, RpcProvider } from 'starknet';
import configuration from '@app/shared/configuration';
import { delay } from '@app/shared/utils/promise';

export type FuelGatewayType = {
  client: Socket;
};

@Injectable()
export class FuelService {
  private sockets: FuelGatewayType[] = [];
  private currentPool: FuelPoolDocument;
  private currentJoinedPool: JoinFuelPoolDocument[] = [];
  private totalStakedPoint: number;
  private chainDocument: ChainDocument;

  constructor(
    @InjectModel(FuelPool.name)
    private readonly fuelPoolModel: Model<FuelPoolDocument>,
    @InjectModel(JoinFuelPool.name)
    private readonly joinFuelPoolModel: Model<JoinFuelPoolDocument>,
    @InjectModel(Chains.name)
    private readonly chainModel: Model<ChainDocument>,
  ) {}

  logger = new Logger(FuelService.name);
  isFinishedSetWinner = true;

  private sendCurrentPool(socket: FuelGatewayType) {
    socket.client.emit(FuelEvents.CURRENT_POOL, this.currentPool);
  }

  private sendCurrentJoinedPool(socket: FuelGatewayType) {
    socket.client.emit(FuelEvents.CURRENT_JOINED_POOL, this.currentJoinedPool);
  }

  private sendTotalOnlineClient(socket: FuelGatewayType) {
    socket.client.emit(FuelEvents.TOTAL_ONLINE, this.sockets.length);
  }
  private sendCurrentTotalPoint(socket: FuelGatewayType, point: number) {
    socket.client.emit(FuelEvents.TOTAL_POINT, point);
  }
  private async sendWinner(socket: FuelGatewayType, winner: UserDocument) {
    socket.client.emit(FuelEvents.WINNER, winner);
  }

  private async sendAllTotalOnlineClient() {
    await Promise.all(
      this.sockets.map(async (sk) => {
        this.sendTotalOnlineClient(sk);
      }),
    );
  }

  private async sendAllCurrentPool() {
    const currentPool = await this.fuelPoolModel.findOne(
      { address: this.chainDocument.currentFuelContract },
      {},
      { sort: { id: -1 } },
    );

    if (currentPool && this.currentPool.id !== currentPool.id) {
      await this.handlUpdatePool(currentPool);
      await Promise.all(
        this.sockets.map(async (sk) => {
          this.sendCurrentPool(sk);
        }),
      );
    }
  }

  private async sendAllCurrentJoinedPool() {
    await Promise.all(
      this.sockets.map(async (sk) => {
        this.sendCurrentJoinedPool(sk);
        this.sendCurrentTotalPoint(sk, this.totalStakedPoint);
      }),
    );
  }

  private async sendAllWinner(winner: UserDocument) {
    await Promise.all(
      this.sockets.map(async (sk) => {
        this.sendWinner(sk, winner);
      }),
    );
  }

  private setWinner(): UserDocument {
    const ranges: { user: UserDocument; start: number; end: number }[] = [];
    let start = 0;

    this.currentJoinedPool.forEach((entry) => {
      const probability = entry.stakedAmount / this.totalStakedPoint;
      const end = start + probability;
      ranges.push({ user: entry.user, start, end });
      start = end;
    });

    const random = Math.random();

    const winner = ranges.find(
      (range) => random >= range.start && random < range.end,
    );

    return winner.user;
  }

  async handleInit() {
    this.chainDocument = await this.chainModel.findOne();
    await this.handlUpdatePool();
  }

  async handlUpdatePool(currentPool?: FuelPoolDocument) {
    this.currentPool = currentPool
      ? currentPool
      : await this.fuelPoolModel.findOne(
          { address: this.chainDocument.currentFuelContract },
          {},
          { sort: { id: -1 } },
        );

    if (this.currentPool) {
      await this.handleUpdateJoinedtPool();
    }
  }

  async handleUpdateJoinedtPool() {
    this.currentJoinedPool = await this.joinFuelPoolModel
      .find({
        poolId: this.currentPool.id,
        poolContract: this.chainDocument.currentFuelContract,
      })
      .populate([
        {
          path: 'user',
          select: [
            'address',
            'username',
            'isVerified',
            'email',
            'avatar',
            'cover',
            'isVerified',
          ],
        },
      ]);

    this.totalStakedPoint = this.currentJoinedPool.reduce(
      (sum, entry) => sum + entry.stakedAmount,
      0,
    );
    await this.sendAllCurrentJoinedPool();
  }

  handleConenction(client: Socket) {
    let existedClient = this.sockets.find((i) => i.client === client);
    if (existedClient) {
    } else {
      existedClient = {
        client,
      };

      this.sockets.push(existedClient);
    }

    this.sendTotalOnlineClient(existedClient);
    this.sendCurrentPool(existedClient);
    this.sendCurrentTotalPoint(existedClient, this.totalStakedPoint);
    this.sendCurrentJoinedPool(existedClient);
  }

  handleDisconnection(client: Socket) {
    this.sockets = this.sockets.filter((sk) => sk.client !== client);
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async getTotalOnlineClient() {
    await this.sendAllTotalOnlineClient();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async getCurrentPool() {
    await this.sendAllCurrentPool();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async getCurrentJoinedPool() {
    if (this.currentPool) {
      const currentTotalStaked = await this.joinFuelPoolModel.aggregate([
        {
          $match: {
            poolId: this.currentPool.id,
            poolContract: this.chainDocument.currentFuelContract,
          },
        },
        {
          $group: {
            _id: 0,
            totakStaked: { $sum: '$stakedAmount' },
          },
        },
      ]);

      if (
        currentTotalStaked.length > 0 &&
        this.totalStakedPoint !== currentTotalStaked[0].totakStaked
      ) {
        await this.handleUpdateJoinedtPool();
      }
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleSetWinner() {
    try {
      if (!this.isFinishedSetWinner) {
        return;
      }
      this.isFinishedSetWinner = false;
      const now = Date.now();

      if (
        !this.currentPool ||
        (this.currentPool && now >= this.currentPool.endAt)
      ) {
        if (this.currentJoinedPool.length > 3) {
          const winner = this.setWinner();
          await this.fuelPoolModel.findOneAndUpdate(
            {
              address: this.chainDocument.currentFuelContract,
              id: this.currentPool.id,
            },
            {
              $set: {
                winner,
              },
            },
            {
              new: true,
            },
          );

          await this.sendAllWinner(winner);
        }

        // TODO start new pool
        const provider = new RpcProvider({ nodeUrl: this.chainDocument.rpc });
        const drawerAccount = new Account(
          provider,
          configuration().ACCOUNT_ADDRESS,
          configuration().PRIVATE_KEY,
        );
        const executeNewPool = await drawerAccount.execute([
          {
            contractAddress: this.chainDocument.currentFuelContract,
            entrypoint: 'manuallyCreatePool',
            calldata: [],
          },
        ]);
        await provider.waitForTransaction(executeNewPool.transaction_hash);
        this.logger.debug(
          `New Pool Created with tx: ${executeNewPool.transaction_hash}`,
        );

        await delay(1);
        await this.handlUpdatePool();
      }
      this.isFinishedSetWinner = true;
    } catch (error) {
    } finally {
      this.isFinishedSetWinner = true;
    }
  }
}
