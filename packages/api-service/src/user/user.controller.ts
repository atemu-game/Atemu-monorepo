import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JWT, User } from '@app/shared/modules';

import { BaseResult } from '@app/shared/types/base.result';

import { iInfoToken } from '@app/shared/modules/jwt/jwt.dto';
import { UserDto } from '@app/shared/models/dtos';
import { UpdateRpcDTO } from './dto/user.dto';

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

  @JWT()
  @Post('/setting/customRPC')
  async postCustomRpc(@Body() rpcDto: UpdateRpcDTO, @User() user: iInfoToken) {
    const data = await this.userService.createOrUpdateCustomRPC(
      user.sub,
      rpcDto.rpc,
    );

    return new BaseResult(data);
  }

  @HttpCode(200)
  @JWT()
  @Get('/setting/customRPC')
  async getCustomRpc(@User() user: iInfoToken) {
    const data = await this.userService.getCustomRPC(user.sub);
    return new BaseResult(data);
  }

  @JWT()
  @Delete('/setting/customRPC')
  async deleteCustomRpc(@User() user: iInfoToken) {
    const data = await this.userService.deleteCustomRPC(user.sub);
    return new BaseResult(data);
  }
}
