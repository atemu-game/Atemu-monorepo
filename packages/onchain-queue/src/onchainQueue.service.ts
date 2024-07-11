import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { UserPoints } from '@app/shared/models/schema/userpoints.schema';
import { Model } from 'mongoose';
import { Web3Service } from 'web3/src/web3.service';
import { UserPointService } from './userpoints/userpoint.service';
import { EventType, LogsReturnValues } from 'web3/src/types';
import { ChainDocument } from '@app/shared/models';

@Injectable()
export class OnchainQueueService {
  constructor(
    @InjectModel(UserPoints.name)
    private readonly userPointsModel: Model<UserPoints>,
    private readonly web3Service: Web3Service,
    private readonly userPointService: UserPointService,
  ) {}
  logger = new Logger(OnchainQueueService.name);

  async processEvent(log: LogsReturnValues, chain: ChainDocument) {
    const process: any = {};
    process[EventType.AddPoint] = this.proccessAddPointEvent;
    await process[log.eventType].call(this, log, chain);
  }

  async proccessAddPointEvent(log: LogsReturnValues) {
    const { address, points } = log.returnValues;
    const userPoint = await this.userPointService.getUserPoint(address);
    if (!userPoint) {
      await this.userPointService.updateUserPoint(address, points);
    } else {
      await this.userPointService.updateUserPoint(
        address,
        userPoint.points + points,
      );
    }
  }
}
