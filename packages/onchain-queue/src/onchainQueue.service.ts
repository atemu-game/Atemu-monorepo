import { Injectable, Logger } from '@nestjs/common';

import { UserPointService } from './userpoints/userpoint.service';
import { EventType, LogsReturnValues } from 'web3/src/types';
import { ChainDocument } from '@app/shared/models';

@Injectable()
export class OnchainQueueService {
  constructor(private readonly userPointService: UserPointService) {}

  logger = new Logger(OnchainQueueService.name);

  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};

    process[EventType.AddPoint] = this.proccessAddPointEvent;
    console.log('Log', log);
    await process[log.eventType].call(this, log, chain);
  }

  async proccessAddPointEvent(log: LogsReturnValues) {
    const { reciver, point } = log.returnValues;

    // const userPoint = await this.userPointService.getUserPoint(reciver);

    await this.userPointService.updateUserPoint(reciver, point);
  }
}
