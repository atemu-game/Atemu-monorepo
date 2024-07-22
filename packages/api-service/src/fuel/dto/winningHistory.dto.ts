import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsHexadecimal } from 'class-validator';

export class QueryWinningHistoryDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  user: string;

  @ApiProperty()
  @IsBoolean()
  isClaimed?: boolean;
}
