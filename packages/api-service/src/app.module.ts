import { MongooseModule } from '@nestjs/mongoose';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { UsersModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AppLoggerMiddleware } from '@app/shared/middlewares/app-logger.middleware';
import configuration from '@app/shared/configuration';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    WalletModule,
    MongooseModule.forRoot(configuration().DB_PATH),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
