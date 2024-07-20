import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FuelGateway } from './fuel.gateway';
import { FuelService } from './fuel.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chains,
  ChainSchema,
  FuelPool,
  FuelPoolSchema,
  JoinFuelPool,
  JoinFuelPoolSchema,
} from '@app/shared/models';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: FuelPool.name, schema: FuelPoolSchema },
      { name: JoinFuelPool.name, schema: JoinFuelPoolSchema },
      { name: Chains.name, schema: ChainSchema },
    ]),
  ],
  providers: [FuelGateway, FuelService],
})
export class FuelModule {}
