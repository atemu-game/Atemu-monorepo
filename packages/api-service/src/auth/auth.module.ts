import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../user/user.module';
import { UserSchema, Users } from '@app/shared/models';
import { JwtModule } from '@nestjs/jwt';
import configuration from '@app/shared/configuration';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    UsersModule,
    WalletModule,
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: configuration().JWT_SECRET,
        signOptions: {
          expiresIn: configuration().JWT_EXPIRE,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
