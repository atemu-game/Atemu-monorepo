import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersModule } from '../user/user.module';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { UserSchema, Users } from '@app/shared/models';
@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [],
})
export class LeadboardModule {}
