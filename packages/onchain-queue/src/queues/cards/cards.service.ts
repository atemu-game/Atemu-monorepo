import { Injectable, Logger } from '@nestjs/common';
import { OnchainQueueService } from '../../onchainQueue.service';
import {
  CardCollectionDocument,
  CardCollections,
  CardDocument,
  Cards,
  ChainDocument,
  HistoryTx,
} from '@app/shared/models';
import { EventType, LogsReturnValues } from '@app/web3/types';
import { UserPointService } from '../../userpoints/userpoint.service';
import { CardTransferReturnValue } from '@app/web3/decode';
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

@Injectable()
export class CardService implements OnchainQueueService {
  constructor(
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

  logger = new Logger(CardService.name);
  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};

    process[EventType.MintCard] = this.processMintCards;
    process[EventType.TransferCard] = this.processTransferCard;
    await process[log.eventType].call(this, log, chain);
  }

  async processMintCards(log: LogsReturnValues, chain: ChainDocument) {
    const { from, to, tokenId, cardAddress, value, timestamp } =
      log.returnValues as CardTransferReturnValue;

    const fromUser = await this.userPointService.getUserOrCreate(from, chain);
    const toUser = await this.userPointService.getUserOrCreate(to, chain);
    const cardCollection = await this.cardCollectionModel.findOne({
      cardContract: cardAddress,
    });

    let existingCard = await this.cardModel.findOne({
      cardContract: cardAddress,
      cardId: tokenId,
      owner: toUser,
    });

    if (existingCard) {
      if (timestamp >= existingCard.blockTime) {
        existingCard.amount += value;
        existingCard.blockTime = timestamp;
        await existingCard.save();
      }
    } else {
      const newCard: Cards = {
        cardId: tokenId,
        cardContract: cardAddress,
        cardCollection,
        chain,
        blockTime: timestamp,
        owner: toUser,
        amount: value,
      };
      existingCard = await this.cardModel.findOneAndUpdate(
        { cardContract: cardAddress, cardId: tokenId, owner: toUser },
        { $set: newCard },
        { upsert: true, new: true },
      );
    }

    const history: HistoryTx = {
      txHash: log.transaction_hash,
      index: log.index,
      from: fromUser,
      to: toUser,
      amountPoints: 0,
      cardAddress,
      cardId: tokenId,
      amountCards: value,
      timestamp,
      type: HistoryTxType.MintCard,
    };

    await this.historyModel.findOneAndUpdate(
      { txHash: log.transaction_hash, index: log.index },
      { $set: history },
      { upsert: true },
    );

    await this.fetchMetadataQueue.add(JOB_QUEUE_NFT_METADATA, existingCard._id);
  }

  async processTransferCard(log: LogsReturnValues, chain: ChainDocument) {
    const { from, to, tokenId, cardAddress, value, timestamp } =
      log.returnValues as CardTransferReturnValue;

    const fromUser = await this.userPointService.getUserOrCreate(from, chain);
    const toUser = await this.userPointService.getUserOrCreate(to, chain);

    const cardCollection = await this.cardCollectionModel.findOne({
      cardContract: cardAddress,
    });

    const existingFromCard = await this.cardModel.findOne({
      cardContract: cardAddress,
      cardId: tokenId,
      owner: fromUser,
    });

    let existingToCard = await this.cardModel.findOne({
      cardContract: cardAddress,
      cardId: tokenId,
      owner: toUser,
    });

    if (existingFromCard && timestamp >= existingFromCard.blockTime) {
      existingFromCard.amount -= value;
      existingFromCard.blockTime = timestamp;
      await existingFromCard.save();
    }

    if (existingToCard && timestamp >= existingToCard.blockTime) {
      existingToCard.amount += value;
      existingToCard.blockTime = timestamp;
      await existingToCard.save();
    } else {
      const newCard: Cards = {
        cardId: tokenId,
        cardContract: cardAddress,
        cardCollection,
        chain,
        blockTime: timestamp,
        owner: toUser,
        amount: value,
      };
      existingToCard = await this.cardModel.findOneAndUpdate(
        { cardContract: cardAddress, cardId: tokenId, owner: toUser },
        { $set: newCard },
        { upsert: true, new: true },
      );

      await this.fetchMetadataQueue.add(
        JOB_QUEUE_NFT_METADATA,
        existingToCard._id,
      );
    }

    const history: HistoryTx = {
      txHash: log.transaction_hash,
      index: log.index,
      from: fromUser,
      to: toUser,
      amountPoints: 0,
      cardAddress,
      cardId: tokenId,
      amountCards: value,
      timestamp,
      type: HistoryTxType.MintCard,
    };

    await this.historyModel.findOneAndUpdate(
      { txHash: log.transaction_hash, index: log.index },
      { $set: history },
      { upsert: true },
    );
  }
}
