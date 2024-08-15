import { BaseQueryParams } from '@app/shared/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsHexadecimal, IsOptional } from 'class-validator';

export class QueryWinningHistoryDto extends BaseQueryParams {
  @ApiProperty()
  @IsHexadecimal()
  @IsOptional()
  user?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isClaimed?: boolean;
}
