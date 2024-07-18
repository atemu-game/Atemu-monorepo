import { BliztPointQueueModule } from './queues/point/BliztPointQueue.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import configuration from '@app/shared/configuration';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TransferBliztPointQueueModule } from './queues/point/transferBliztPointQueue.module';
import { JoinFuelPoolQueueModule } from './queues/fuel/joinPool.module';
import { CreateFuelPoolQueueModule } from './queues/fuel/createPool.module';
import { ClaimFuelRewardQueueModule } from './queues/fuel/claimReward.module';
import { MintCardQueueModule } from './queues/cards/mintCard.module';
import { TransferCardQueueModule } from './queues/cards/transferCard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().DB_PATH),
    BullModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        imports: [ConfigModule],
        redis: {
          host: config.get('QUEUE_HOST'),
          port: config.get('QUEUE_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BliztPointQueueModule,
    TransferBliztPointQueueModule,
    CreateFuelPoolQueueModule,
    JoinFuelPoolQueueModule,
    ClaimFuelRewardQueueModule,
    MintCardQueueModule,
    TransferCardQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class OnChainQueueModule {}
