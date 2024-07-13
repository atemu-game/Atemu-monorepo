import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersModule } from '../user/user.module';
import {
  UserPoints,
  UserPointsSchema,
} from '@app/shared/models/schema/userpoints.schema';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: UserPoints.name, schema: UserPointsSchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [],
})
export class LeadboardModule {}
