import { Controller, Post, Body, HttpCode, Get, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiExtraModels,
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JWT, User } from '@app/shared/modules';
import {
  CreateWalletReqDTO,
  CreateWalletResDTO,
  RspWalletDTO,
  WidthDrawDTO,
} from './dto/wallet.dto';
import { BaseResult } from '@app/shared/types';
import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';

// TODO NOTE
// import { TokenType } from '@app/shared/models';

@ApiTags('Wallet')
@ApiExtraModels(CreateWalletResDTO, CreateWalletReqDTO, WidthDrawDTO)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @JWT()
  @Get('/getOrCreateWallet')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get Or Create Private Wallet From User Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {},
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async getOrCreateWallet(
    @Req() req: Request,
    @User() user: iInfoToken,
  ): Promise<BaseResult<RspWalletDTO>> {
    try {
      const data = await this.walletService.getOrCreateWalletByEth(user.sub);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @JWT()
  @Post('deploy')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Deploy Wallet From User Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async deployWallet(@Req() req: Request, @User() user: iInfoToken) {
    const data = await this.walletService.deployWalletByEth(user.sub);
    return new BaseResult(data);
  }

  @JWT()
  @Get('getBalancePayer')
  @ApiOperation({
    summary: 'Get Balance Wallet Creator  From User Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async getBalanceWallet(@User() user: iInfoToken) {
    const data = await this.walletService.getBalancePayer(user.sub);
    return new BaseResult(data);
  }

  @JWT()
  @Post('withdrawCreatorAccount')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Width Draw ETH By Payer Address',
    description:
      'Utilize this API to enable users to generate a wallet directly within our marketplace when needed to a function',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: '<b>Internal server error</b>',
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(BaseResult),
          properties: {
            errors: {
              example: 'Error Message',
            },
            success: {
              example: false,
            },
          },
        },
      ],
    },
  })
  async withdraw(@Body() withdrawDto: WidthDrawDTO, @User() user: iInfoToken) {
    const data = await this.walletService.withDrawEth(
      user.sub,
      withdrawDto.reciverAddress,
      withdrawDto.amount,
    );
    return new BaseResult(data);
  }
}
