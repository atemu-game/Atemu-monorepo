import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '@app/shared/configuration';
import { MetadataModule } from './metadata/metadata.module';
import { MongooseModule } from '@nestjs/mongoose';

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
    MetadataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
