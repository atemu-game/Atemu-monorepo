import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Socket } from 'socket.io';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FuelEvents } from '@app/shared/constants';
import {
  CardCollectionDocument,
  CardCollections,
  ChainDocument,
  Chains,
  FuelPool,
  FuelPoolDocument,
  JoinFuelPool,
  JoinFuelPoolDocument,
  UserDocument,
} from '@app/shared/models';
import { Model } from 'mongoose';
import {
  Account,
  RpcProvider,
  TypedData,
  shortString,
  uint256,
  stark,
} from 'starknet';
import configuration from '@app/shared/configuration';
import { delay } from '@app/shared/utils/promise';
import { QueryWinningHistoryDto } from './dto/winningHistory.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import {
  formattedContractAddress,
  isValidAddress,
  isValidObjectId,
} from '@app/shared/utils';
import { UserService } from '../user/user.service';
import { PaginationDto } from '@app/shared/types/pagination.dto';
import {
  ClaimFuelRewardQueryDto,
  ClaimFuelRewardResult,
} from './dto/claimReward.dto';

export type FuelGatewayType = {
  client: Socket;
};

export type WinnerParam = {
  winner: UserDocument;
  cardId: string;
  cardContract: string;
  cardCollection: CardCollectionDocument;
  amountOfCards: number;
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
    @InjectModel(CardCollections.name)
    private readonly cardCollectionModel: Model<CardCollectionDocument>,
    private userService: UserService,
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
  private async sendWinner(socket: FuelGatewayType, winner: WinnerParam) {
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

  private async sendAllWinner(winner: WinnerParam) {
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

  async getHistoryWinning(
    query: QueryWinningHistoryDto,
  ): Promise<BaseResultPagination<FuelPoolDocument>> {
    const { page, size, skipIndex } = query;
    const result = new BaseResultPagination<FuelPoolDocument>();

    const user = query.user;
    const filter: any = {};
    filter.winner = { $ne: null };

    if (user) {
      if (isValidObjectId(user)) {
        filter.winner = user;
      } else if (isValidAddress(user)) {
        const userDocument = await this.userService.getOrCreateUser(user);
        if (userDocument) {
          filter.winner = userDocument._id;
        }
      } else {
        throw new HttpException('Invalid user', HttpStatus.BAD_REQUEST);
      }
    }

    if (query.isClaimed !== undefined && query.isClaimed !== null) {
      filter.isClaimed = query.isClaimed;
    }
    const total = await this.fuelPoolModel.countDocuments(filter);
    if (total === 0) {
      result.data = new PaginationDto([], total, page, size);

      return result;
    }

    const items = await this.fuelPoolModel.find(
      filter,
      {},
      { sort: { endAt: -1 }, skip: skipIndex, limit: size },
    );
    result.data = new PaginationDto(items, total, page, size);

    return result;
  }

  async getClaimReward(
    user: string,
    query: ClaimFuelRewardQueryDto,
  ): Promise<BaseResult<ClaimFuelRewardResult>> {
    const { poolContract, poolId } = query;
    const formattedAddress = formattedContractAddress(poolContract);
    const userDocument = await this.userService.getOrCreateUser(user);

    const poolDetail = await this.fuelPoolModel.findOne({
      address: formattedAddress,
      id: poolId,
      winner: userDocument,
    });

    if (!poolDetail) {
      throw new HttpException('Winning pool not found', HttpStatus.NOT_FOUND);
    }

    const typedMessage: TypedData = {
      types: {
        WinnerStruct: [
          {
            name: 'poolId',
            type: 'u256',
          },
          {
            name: 'winner',
            type: 'ContractAddress',
          },
          {
            name: 'cardId',
            type: 'u256',
          },
          {
            name: 'amountCards',
            type: 'u256',
          },
        ],
        u256: [
          { name: 'low', type: 'felt' },
          { name: 'high', type: 'felt' },
        ],
        StarkNetDomain: [
          {
            name: 'name',
            type: 'felt',
          },
          {
            name: 'version',
            type: 'felt',
          },
          {
            name: 'chainId',
            type: 'felt',
          },
        ],
      },
      primaryType: 'WinnerStruct',
      domain: {
        name: 'atemu',
        version: '1',
        chainId: shortString.encodeShortString(configuration().CHAIN_ID),
      },
      message: {
        poolId: uint256.bnToUint256(1),
        winner: user,
        cardId: uint256.bnToUint256(1),
        amountCards: uint256.bnToUint256(1),
      },
    };

    const provider = new RpcProvider({ nodeUrl: this.chainDocument.rpc });
    const drawerAccount = new Account(
      provider,
      configuration().ACCOUNT_ADDRESS,
      configuration().PRIVATE_KEY,
    );
    const signature = await drawerAccount.signMessage(typedMessage);
    const proof = stark.formatSignature(signature);

    const result: ClaimFuelRewardResult = {
      poolId,
      poolContract,
      cardContract: poolDetail.cardContract,
      cardId: poolDetail.cardId,
      amountOfCards: poolDetail.amountOfCards,
      proof,
    };
    return new BaseResult(result);
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
    if (!this.isFinishedSetWinner) {
      return;
    }
    this.isFinishedSetWinner = false;
    const now = Date.now();

    if (
      !this.currentPool ||
      (this.currentPool && now >= this.currentPool.endAt)
    ) {
      this.logger.log(this.currentPool);
      if (this.currentJoinedPool.length >= 3) {
        const winner = this.setWinner();

        const cardCollection = await this.cardCollectionModel.findOne();
        const winnerParam: WinnerParam = {
          winner,
          cardId: '1',
          cardContract: cardCollection.cardContract,
          cardCollection,
          amountOfCards: 1,
        };

        await this.fuelPoolModel.findOneAndUpdate(
          {
            address: this.chainDocument.currentFuelContract,
            id: this.currentPool.id,
          },
          {
            $set: winnerParam,
          },
          {
            new: true,
          },
        );

        await this.sendAllWinner(winnerParam);
      }

      // TODO start new pool
      let isCreateFinished = false;
      while (!isCreateFinished) {
        try {
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

          await delay(5);
          await this.handlUpdatePool();
          isCreateFinished = true;
        } catch (error) {
          if (
            !(error.message as string).includes('Previous Pool Not End Yet')
          ) {
            this.logger.error(error.message);
          }

          await delay(1);
        }
      }
    }
    this.isFinishedSetWinner = true;
  }
}
