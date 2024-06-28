import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Req, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { JWT, User } from '@app/shared/modules';

import { BaseResult } from '@app/shared/types/base.result';

import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { UserDto } from '@app/shared/models/dtos';

@ApiTags('Users')
@Controller('user')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @JWT()
  @Get('/info')
  async getUserInfo(
    @Req() req: Request,
    @User() user: iInfoToken,
  ): Promise<BaseResult<UserDto>> {
    const data = await this.userService.getUser(user.sub);

    return new BaseResult<UserDto>(data);
  }

  @Get('/configuration/defaultRPC')
  async getDefaultRpc() {
    const ListPublicRPC = [
      'https://starknet-sepolia.public.blastapi.io',
      'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
      'https://starknet-sepolia.public.blastapi.io/rpc/v0_6',
      'https://starknet-sepolia.reddio.com/rpc/v0_7',
      'https://starknet-sepolia.reddio.com',
    ];

    return new BaseResult(ListPublicRPC);
  }

  @JWT()
  @Post('/configuration/customRPC')
  async setCustomRpc(@Req() req: Request, @User() user: iInfoToken) {
    const data = await this.userService.getUser(user.sub);

    return new BaseResult(data);
  }
}
