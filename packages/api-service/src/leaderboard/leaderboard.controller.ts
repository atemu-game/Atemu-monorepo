import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { LeaderBoardFilterParams } from './types';
@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('/topPoints')
  async getLeaderboard(@Param() params: LeaderBoardFilterParams) {
    const data = await this.leaderboardService.getLeaderboard(params);
    return data;
  }
  @Get('/topPoints/:address')
  async getLeaderboardByAddress(@Param('address') address: string) {
    const data = await this.leaderboardService.getLeaderboardByAddress(address);
    return data;
  }
}
