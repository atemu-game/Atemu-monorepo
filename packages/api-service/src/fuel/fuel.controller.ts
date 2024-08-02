import {
  ApiTags,
  ApiExtraModels,
  ApiOperation,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { QueryWinningHistoryDto } from './dto/winningHistory.dto';
import { BaseResult, BaseResultPagination } from '@app/shared/types';
import { FuelPoolDocument } from '@app/shared/models';
import { JWT, User } from '@app/shared/modules';
import {
  ClaimFuelRewardQueryDto,
  ClaimFuelRewardResult,
} from './dto/claimReward.dto';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';

@ApiTags('Fuel')
@ApiExtraModels(BaseResult, ClaimFuelRewardResult)
@Controller('fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post('winning-history')
  @ApiOperation({
    description: 'If isClaimed is null, returning both true and false',
  })
  async getWinningHistory(
    @Body() query: QueryWinningHistoryDto,
  ): Promise<BaseResultPagination<FuelPoolDocument>> {
    return await this.fuelService.getHistoryWinning(query);
  }

  @JWT()
  @Post('claim-reward')
  @ApiOperation({
    description: 'Claim fuel reward',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
        {
          properties: {
            data: {
              allOf: [
                {
                  $ref: getSchemaPath(ClaimFuelRewardResult),
                },
              ],
            },
          },
        },
      ],
    },
  })
  async claimReward(
    @Body() query: ClaimFuelRewardQueryDto,
    @User() user: iInfoToken,
  ): Promise<BaseResult<ClaimFuelRewardResult>> {
    return await this.fuelService.getClaimReward(user.sub, query);
  }
}
