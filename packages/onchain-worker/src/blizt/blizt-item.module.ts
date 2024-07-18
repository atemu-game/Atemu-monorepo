import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { BliztItemController } from './blizt-item.controller';
import { BullModule } from '@nestjs/bull';
import {
  MQ_JOB_DEFAULT_CONFIG,
  ONCHAIN_QUEUES,
} from '@app/shared/constants/queue';
import { Blocks, BlockSchema, Chains, ChainSchema } from '@app/shared/models';

import { Web3Service } from '@app/web3/web3.service';
import { OnchainWorkerQueueService } from '../queue/onchainWorkerQueue';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chains.name, schema: ChainSchema },
      { name: Blocks.name, schema: BlockSchema },
    ]),
    BullModule.registerQueue(
      {
        name: ONCHAIN_QUEUES.QUEUE_ADD_POINT,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_TRANSFER_POINT,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_CREATE_POOL,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_JOIN_POOL,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_CLAIM_FUEL_REWARD,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_MINT_CARD,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: ONCHAIN_QUEUES.QUEUE_TRANSFER_CARD,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
    ),
  ],
  controllers: [BliztItemController],
  providers: [Web3Service, OnchainWorkerQueueService],
})
export class BliztItemModule {}
