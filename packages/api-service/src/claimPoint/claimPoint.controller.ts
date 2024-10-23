import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ClaimPointService } from './claimPoint.service';
import { JWT, User } from '@app/shared/modules';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
@ApiTags('Claim')
@Controller('claim')
export class ClaimPointController {
  constructor(private readonly claimPointService: ClaimPointService) {}

  @HttpCode(200)
  @ApiOperation({
    summary: 'Claim Point Wallet Base Age',
    description:
      'Utilize this API to get blitz point wallet base on age created on starknet',
  })
  @JWT()
  @Get('/ageWalletPoint')
  async getClaimPoint(@User() info: iInfoToken) {
    return this.claimPointService.getOrCreateClaimPoint(info.sub);
  }

  @HttpCode(200)
  @ApiOperation({
    summary: 'Claim Point Wallet Base Age',
    description:
      'Utilize this API to get blitz point wallet base on age created on starknet',
  })
  @JWT()
  @Post('/claimAgeWalletPoint')
  async claimPoint(@User() info: iInfoToken) {
    return this.claimPointService.claimAgePoint(info.sub);
  }
}
