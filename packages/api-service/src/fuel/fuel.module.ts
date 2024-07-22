import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FuelGateway } from './fuel.gateway';
import { FuelService } from './fuel.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CardCollections,
  cardCollectionSchema,
  Chains,
  ChainSchema,
  FuelPool,
  FuelPoolSchema,
  JoinFuelPool,
  JoinFuelPoolSchema,
  UserConfig,
  UserConfigSchema,
  Users,
  UserSchema,
} from '@app/shared/models';
import { PassportModule } from '@nestjs/passport';
import { FuelController } from './fuel.controller';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: FuelPool.name, schema: FuelPoolSchema },
      { name: JoinFuelPool.name, schema: JoinFuelPoolSchema },
      { name: Chains.name, schema: ChainSchema },
      { name: CardCollections.name, schema: cardCollectionSchema },
      { name: Users.name, schema: UserSchema },
      { name: UserConfig.name, schema: UserConfigSchema },
    ]),
  ],
  providers: [FuelGateway, FuelService, UserService],
  controllers: [FuelController],
})
export class FuelModule {}
