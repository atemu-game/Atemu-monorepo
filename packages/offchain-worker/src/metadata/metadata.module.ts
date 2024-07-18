import {
  Cards,
  ChainSchema,
  Chains,
  CardSchema,
  CardCollections,
  cardCollectionSchema,
} from '@app/shared/models';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataService } from './metadata.service';
import { FetchMetadataProcessor } from './queue/fetch-metadata.processor';
import { QUEUE_METADATA } from '@app/shared/constants/queue';
import { Web3Service } from '@app/web3/web3.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_METADATA,
    }),
    MongooseModule.forFeature([
      { name: Cards.name, schema: CardSchema },
      { name: CardCollections.name, schema: cardCollectionSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [MetadataService, FetchMetadataProcessor, Web3Service],
})
export class MetadataModule {}
