import { Injectable, Logger } from '@nestjs/common';
import { EventType, LogsReturnValues } from 'web3/src/types';
import { ChainDocument, HistoryTx } from '@app/shared/models';
import { UserPointService } from '../../userpoints/userpoint.service';
import { OnchainQueueService } from '../../onchainQueue.service';
import { TransferPointReturnValue } from '@app/web3/decode';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HistoryTxType } from '@app/shared/constants';

@Injectable()
export class PointService implements OnchainQueueService {
  constructor(
    @InjectModel(HistoryTx.name)
    private readonly historyModel: Model<HistoryTx>,
    private readonly userPointService: UserPointService,
  ) {}

  logger = new Logger(PointService.name);

  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};

    process[EventType.AddPoint] = this.proccessAddPointEvent;
    process[EventType.TransferPoint] = this.processTransferPointEvent;
    await process[log.eventType].call(this, log, chain);
  }

  async proccessAddPointEvent(log: LogsReturnValues) {
    const { reciver, point } = log.returnValues;

    // const userPoint = await this.userPointService.getUserPoint(reciver);
    await this.userPointService.updateUserPoint(reciver, point);
  }

  async processTransferPointEvent(log: LogsReturnValues, chain: ChainDocument) {
    const { from, to, value, timestamp } =
      log.returnValues as TransferPointReturnValue;

    const fromUser = await this.userPointService.updateUserPoint(
      from,
      value,
      true,
    );
    const toUser = await this.userPointService.updateUserPoint(to, value);

    const newHistory: HistoryTx = {
      txHash: log.transaction_hash,
      index: log.index,
      from: fromUser,
      to: toUser,
      amountPoints: value,
      amountCards: 0,
      timestamp,
      type: HistoryTxType.TransferPoint,
    };

    await this.historyModel.findOneAndUpdate(
      {
        txHash: log.transaction_hash,
        index: log.index,
      },
      { $set: newHistory },
      { upsert: true },
    );
  }
}
