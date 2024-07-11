import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('/')
  async getLeaderboard() {
    const data = await this.leaderboardService.getLeaderboard();
    return data;
  }
}
