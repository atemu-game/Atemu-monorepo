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
  HistoryTx,
  HistoryTxChema,
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
import { CardService } from './cards.service';
import { TransferCardProcessor } from './processors/transferCard.proccesor';

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
        name: ONCHAIN_QUEUES.QUEUE_TRANSFER_CARD,
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
    CardService,
    TransferCardProcessor,
  ],
})
export class TransferCardQueueModule {}
