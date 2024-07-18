import { IsEnum } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { TokenType } from '@app/shared/constants/setting';

export class CreateWalletReqDTO {
  @ApiProperty({
    required: true,
    enum: TokenType,
  })
  @IsEnum(TokenType)
  feeType: TokenType;
}

export class CreateWalletResDTO extends CreateWalletReqDTO {
  @ApiProperty()
  payerAddress: string;
  @ApiProperty()
  suggestMaxFee: string;
  @ApiProperty()
  suggestMinFee: string;
  @ApiProperty()
  creatorAddress: string;
}

export class WidthDrawDTO {
  reciverAddress: string;
  amount: number;
  tokenType: TokenType;
}

export class RspWalletDTO {
  @ApiProperty()
  payerAddress: string;
  @ApiProperty()
  creatorAddress: string;
  @ApiProperty()
  feeType: TokenType;
  @ApiProperty()
  feeDeploy: string;
  @ApiProperty()
  privateKey: string;
  @ApiProperty()
  deployHash?: string;
}
