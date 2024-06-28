import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UserService } from './user.service';
import {
  UserConfig,
  UserConfigSchema,
  UserSchema,
  Users,
} from '@app/shared/models';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/shared/modules';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UserSchema },
      { name: UserConfig.name, schema: UserConfigSchema },
    ]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UsersController],
  providers: [UserService, JwtStrategy],
  exports: [UserService],
})
export class UsersModule {}
