import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  Chains,
  ChainSchema,
  HistoryTx,
  HistoryTxChema,
  Users,
  UserSchema,
} from '@app/shared/models';
import {
  MQ_JOB_DEFAULT_CONFIG,
  ONCHAIN_QUEUES,
} from '@app/shared/constants/queue';
import { Web3Service } from 'web3/src/web3.service';

import { UserPointService } from 'onchain-queue/src/userpoints/userpoint.service';
import { BliztPointProcessor } from './processors/BliztPoint.processor';
import { PointService } from './point.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Chains.name,
        schema: ChainSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
      {
        name: HistoryTx.name,
        schema: HistoryTxChema,
      },
    ]),
    BullModule.registerQueue({
      name: ONCHAIN_QUEUES.QUEUE_ADD_POINT,
      defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
    }),
  ],
  providers: [Web3Service, UserPointService, BliztPointProcessor, PointService],
})
export class BliztPointQueueModule {}
