import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  CardCollections,
  cardCollectionSchema,
  Cards,
  CardSchema,
  Chains,
  ChainSchema,
  FuelPool,
  FuelPoolSchema,
  HistoryTx,
  HistoryTxChema,
  JoinFuelPool,
  JoinFuelPoolSchema,
  Users,
  UserSchema,
} from '@app/shared/models';
import {
  MQ_JOB_DEFAULT_CONFIG,
  ONCHAIN_QUEUES,
  QUEUE_METADATA,
} from '@app/shared/constants/queue';
import { Web3Service } from 'web3/src/web3.service';
import { UserPointService } from 'onchain-queue/src/userpoints/userpoint.service';
import { CreateFuelPoolProcessor } from './processors/createFuelPool.proccesor';
import { FuelService } from './fuel.service';

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
        name: FuelPool.name,
        schema: FuelPoolSchema,
      },
      {
        name: JoinFuelPool.name,
        schema: JoinFuelPoolSchema,
      },
      {
        name: HistoryTx.name,
        schema: HistoryTxChema,
      },
      {
        name: CardCollections.name,
        schema: cardCollectionSchema,
      },
      {
        name: Cards.name,
        schema: CardSchema,
      },
    ]),
    BullModule.registerQueue(
      {
        name: ONCHAIN_QUEUES.QUEUE_CREATE_POOL,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
      {
        name: QUEUE_METADATA,
        defaultJobOptions: MQ_JOB_DEFAULT_CONFIG,
      },
    ),
  ],
  providers: [
    Web3Service,
    UserPointService,
    CreateFuelPoolProcessor,
    FuelService,
  ],
})
export class CreateFuelPoolQueueModule {}
