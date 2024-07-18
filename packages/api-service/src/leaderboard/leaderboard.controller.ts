import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { LeaderBoardFilterParams } from './types';
@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post('/topPoints')
  async getLeaderboard(@Body() params: LeaderBoardFilterParams) {
    const data = await this.leaderboardService.getLeaderboard(params);
    return data;
  }
  @Get('/topPoints/:address')
  async getLeaderboardByAddress(@Param('address') address: string) {
    const data = await this.leaderboardService.getLeaderboardByAddress(address);
    return data;
  }
}
