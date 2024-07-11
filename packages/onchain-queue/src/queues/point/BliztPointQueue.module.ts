import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { Chains, ChainSchema, Users, UserSchema } from '@app/shared/models';
import { ONCHAIN_QUEUES } from '@app/shared/constants/queue';
import { Web3Service } from 'web3/src/web3.service';
import {
  UserPoints,
  UserPointsSchema,
} from '@app/shared/models/schema/userpoints.schema';
import { UserPointService } from 'onchain-queue/src/userpoints/userpoint.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Chains.name,
        schema: ChainSchema,
      },
      {
        name: UserPoints.name,
        schema: UserPointsSchema,
      },
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
    BullModule.registerQueue({
      name: ONCHAIN_QUEUES.QUEUE_ADD_POINT,
    }),
  ],
  controllers: [],
  providers: [Web3Service, UserPointService],
})
export class BliztPointQueueModule {}
