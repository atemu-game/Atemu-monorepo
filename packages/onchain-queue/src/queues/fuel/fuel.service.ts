import { Injectable, Logger } from '@nestjs/common';
import { OnchainQueueService } from '../../onchainQueue.service';
import {
  CardCollectionDocument,
  CardCollections,
  CardDocument,
  Cards,
  ChainDocument,
  FuelPool,
  FuelPoolDocument,
  HistoryTx,
  JoinFuelPool,
  JoinFuelPoolDocument,
} from '@app/shared/models';
import { EventType, LogsReturnValues } from '@app/web3/types';
import { UserPointService } from '../../userpoints/userpoint.service';
import {
  ClaimRewardsReturnValue,
  CreatePoolReturnValue,
  joinningPoolReturnValue,
} from '@app/web3/decode';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Web3Service } from '@app/web3/web3.service';
import { HistoryTxType } from '@app/shared/constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  JOB_QUEUE_NFT_METADATA,
  QUEUE_METADATA,
} from '@app/shared/constants/queue';
import { formattedContractAddress } from '@app/shared/utils';

@Injectable()
export class FuelService implements OnchainQueueService {
  constructor(
    @InjectModel(FuelPool.name)
    private readonly fuelPoolModel: Model<FuelPoolDocument>,
    @InjectModel(JoinFuelPool.name)
    private readonly joinFuelPoolModel: Model<JoinFuelPoolDocument>,
    @InjectModel(HistoryTx.name)
    private readonly historyModel: Model<HistoryTx>,
    @InjectModel(CardCollections.name)
    private readonly cardCollectionModel: Model<CardCollectionDocument>,
    @InjectModel(Cards.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectQueue(QUEUE_METADATA)
    private readonly fetchMetadataQueue: Queue<string>,
    private readonly userPointService: UserPointService,
    private readonly web3Service: Web3Service,
  ) {}

  logger = new Logger(FuelService.name);
  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};

    process[EventType.CreatePool] = this.processCreatePoolEv;
    process[EventType.JoiningPool] = this.processJoinPoolEv;
    process[EventType.ClaimReward] = this.processClaimRewardEv;

    await process[log.eventType].call(this, log, chain);
  }

  async getOrCreatePool(
    id: number,
    poolContract: string,
    chain: ChainDocument,
  ) {
    const formatdAddress = formattedContractAddress(poolContract);
    const poolDocument = await this.fuelPoolModel.findOne({
      id,
      address: formatdAddress,
    });

    if (poolDocument) {
      return poolDocument;
    }

    const newPool = await this.web3Service.getPoolDetail(
      id,
      formatdAddress,
      chain,
    );

    if (newPool.startAt > 0) {
      const newPoolEntity: FuelPool = {
        id: newPool.id,
        address: formatdAddress,
        startAt: newPool.startAt,
        endAt: newPool.endAt,
      };
      return await this.fuelPoolModel.findOneAndUpdate(
        { id, address: formatdAddress },
        { $set: newPoolEntity },
        { upsert: true, new: true },
      );
    }

    return null;
  }

  async processCreatePoolEv(log: LogsReturnValues, chain: ChainDocument) {
    const { id, poolContract, startAt, endAt } =
      log.returnValues as CreatePoolReturnValue;

    const newPool: FuelPool = {
      id,
      address: poolContract,
      startAt,
      endAt,
    };

    await this.fuelPoolModel.findOneAndUpdate(
      { id, address: poolContract },
      { $set: newPool },
      { upsert: true },
    );
  }

  async processJoinPoolEv(log: LogsReturnValues, chain: ChainDocument) {
    const { player, poolId, poolContract, stakedAmount, joinedAt } =
      log.returnValues as joinningPoolReturnValue;

    const playerDocument = await this.userPointService.getUser(player);

    const poolDocument = await this.getOrCreatePool(
      poolId,
      poolContract,
      chain,
    );

    if (!poolDocument) {
      return;
    }

    playerDocument.points -= stakedAmount;
    await playerDocument.save();

    const existingJoinPool = await this.joinFuelPoolModel.findOne({
      poolId,
      poolContract,
      user: playerDocument,
    });

    if (existingJoinPool) {
      existingJoinPool.stakedAmount += stakedAmount;
      await existingJoinPool.save();
    } else {
      const newJoinPool: JoinFuelPool = {
        pool: poolDocument,
        poolId,
        poolContract,
        user: playerDocument,
        stakedAmount,
      };

      await this.joinFuelPoolModel.create(newJoinPool);
    }

    const history: HistoryTx = {
      txHash: log.transaction_hash,
      index: log.index,
      from: playerDocument,
      poolContract,
      poolId,
      amountPoints: stakedAmount,
      amountCards: 0,
      timestamp: joinedAt,
      type: HistoryTxType.JoinFuelPool,
    };

    await this.historyModel.findOneAndUpdate(
      { txHash: log.transaction_hash, index: log.index },
      { $set: history },
      { upsert: true },
    );
  }

  async processClaimRewardEv(log: LogsReturnValues, chain: ChainDocument) {
    const {
      poolId,
      poolContract,
      winner,
      totalPoints,
      cardAddress,
      cardId,
      amountCards,
      timestamp,
    } = log.returnValues as ClaimRewardsReturnValue;

    console.log('ClaimReward', log.returnValues);
    const poolDocument = await this.getOrCreatePool(
      poolId,
      poolContract,
      chain,
    );
    if (!poolDocument) {
      return;
    }

    const winnerUser = await this.userPointService.getUser(winner);
    winnerUser.points += totalPoints;
    await winnerUser.save();

    const cardCollection = await this.cardCollectionModel.findOne({
      cardContract: cardAddress,
    });

    let existingCard = await this.cardModel.findOne({
      cardContract: cardAddress,
      cardId,
      owner: winnerUser,
    });

    if (existingCard) {
      if (timestamp >= existingCard.blockTime) {
        existingCard.amount += amountCards;
        existingCard.blockTime = timestamp;
        await existingCard.save();
      }
    } else {
      const newCard: Cards = {
        cardId,
        cardContract: cardAddress,
        cardCollection,
        chain,
        blockTime: timestamp,
        owner: winnerUser,
        amount: amountCards,
      };
      existingCard = await this.cardModel.findOneAndUpdate(
        { cardContract: cardAddress, cardId, owner: winnerUser },
        { $set: newCard },
        { upsert: true, new: true },
      );
    }

    const history: HistoryTx = {
      txHash: log.transaction_hash,
      index: log.index,
      from: winnerUser,
      amountPoints: totalPoints,
      poolContract,
      poolId,
      cardAddress,
      cardId,
      amountCards,
      timestamp,
      type: HistoryTxType.ClaimFuelReward,
    };

    await this.historyModel.findOneAndUpdate(
      { txHash: log.transaction_hash, index: log.index },
      { $set: history },
      { upsert: true },
    );
    await this.fuelPoolModel.findOneAndUpdate(
      { id: poolId, address: poolContract },
      { $set: { isClaimed: true } },
      { upsert: true },
    );
    await this.fetchMetadataQueue.add(JOB_QUEUE_NFT_METADATA, existingCard._id);
  }
}
