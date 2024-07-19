import { MongooseModule } from '@nestjs/mongoose';
// import { PassportModule } from '@nestjs/passport';
import { UserSchema, Users } from '@app/shared/models';

import { WsAuthGuard } from '@app/shared/modules/jwt/ws-auth.guard';
import { Module } from '@nestjs/common';
import { BliztGateway } from './blizt.gateway';
import { BliztService } from './blizt.service';
import { JwtModule } from '@nestjs/jwt';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../user/user.module';
import configuration from '@app/shared/configuration';

@Module({
  imports: [
    WalletModule,
    UsersModule,
    // PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: configuration().JWT_SECRET,
        signOptions: {
          expiresIn: configuration().JWT_EXPIRE,
        },
      }),
    }),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],

  providers: [WsAuthGuard, BliztGateway, BliztService],
  exports: [BliztService],
})
export class BliztModule {}
