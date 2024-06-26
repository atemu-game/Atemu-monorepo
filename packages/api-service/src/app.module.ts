import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AppLoggerMiddleware } from '@app/shared/middlewares/app-logger.middleware';
import configuration from '@app/shared/configuration';
import { WalletModule } from './wallet/wallet.module';

import { ConfigModule } from '@nestjs/config';
import { BliztModule } from './blizt/blizt.module';
import { UserconfigController } from './userconfig/userconfig.controller';
import { UserconfigService } from './userconfig/userconfig.service';
import { UserconfigModule } from './userconfig/userconfig.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UsersModule,
    AuthModule,
    WalletModule,
    BliztModule,
    MongooseModule.forRoot(configuration().DB_PATH),
    UserconfigModule,
  ],
  controllers: [UserconfigController],
  providers: [UserconfigService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
