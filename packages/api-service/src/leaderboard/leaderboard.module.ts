import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersModule } from '../user/user.module';
import {
  UserPoints,
  UserPointsSchema,
} from '@app/shared/models/schema/userpoints.schema';
import { LeaderboardService } from './leaderboard.service';
@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: UserPoints.name, schema: UserPointsSchema },
    ]),
  ],
  providers: [],
  exports: [LeaderboardService],
})
export class LeadboardModule {}
