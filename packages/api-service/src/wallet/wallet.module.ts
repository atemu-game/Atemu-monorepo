import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserSchema, Users } from '@app/shared/models';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../user/user.module';
import { JwtStrategy } from '@app/shared/modules';
import configuration from '@app/shared/configuration';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UserSchema,
      },
    ]),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: configuration().JWT_SECRET,
        signOptions: {
          expiresIn: configuration().JWT_EXPIRE,
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, JwtStrategy],
  exports: [WalletService],
})
export class WalletModule {}
