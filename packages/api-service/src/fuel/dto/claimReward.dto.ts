import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsHexadecimal } from 'class-validator';

export class ClaimFuelRewardQueryDto {
  @ApiProperty()
  @IsNumberString()
  poolId: string;

  @ApiProperty()
  @IsHexadecimal()
  poolContract: string;
}

export class ClaimFuelRewardResult {
  @ApiProperty()
  poolId: string;

  @ApiProperty()
  poolContract: string;

  @ApiProperty()
  cardContract: string;

  @ApiProperty()
  cardId: string;

  @ApiProperty()
  amountOfCards: number;

  @ApiProperty()
  proof: string[];
}
