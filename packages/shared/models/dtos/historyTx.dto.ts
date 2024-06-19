import { Transform } from 'class-transformer';
import { IsEnum, IsHexadecimal, IsNumber, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { PaymentTokenDto } from './paymentToken.dto';
import { HistoryTxType } from '../types';

export class HistoryDto {
  @IsNumber()
  @ApiProperty()
  tokenId: number;

  @IsHexadecimal()
  @Length(66, 66)
  @Transform(({ value }) => {
    if (String(value).length == 66) {
      return String(value).toLowerCase().trim();
    }
    return String(value).toLowerCase().trim().replace('0x', '0x0');
  })
  @ApiProperty()
  nftContract: string;

  @ApiProperty({ type: () => UserDto })
  from: UserDto;

  @ApiProperty({ type: () => UserDto })
  to: UserDto;

  @IsNumber()
  @ApiProperty()
  price: number;

  @IsNumber()
  @ApiProperty()
  priceInUsd: number;

  @IsHexadecimal()
  @ApiProperty()
  txHash: string;

  @IsNumber()
  @ApiProperty()
  timestamp: number;

  @IsEnum(HistoryTxType)
  @ApiProperty({ required: true, enum: HistoryTxType })
  type: HistoryTxType;

  @ApiProperty({ type: () => PaymentTokenDto })
  paymentToken?: PaymentTokenDto;
}
