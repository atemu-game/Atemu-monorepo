import { BliztPointQueueModule } from './queues/point/BliztPointQueue.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import configuration from '@app/shared/configuration';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

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
  ],
  controllers: [],
  providers: [],
})
export class OnChainQueueModule {}
