import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode } from '@nestjs/common';
import { SystemService } from './system.service';
import { BaseResult } from '@app/shared/types';
@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @HttpCode(200)
  @Get('/defaultRPC')
  async getDefaultRpcPublic() {
    const data = await this.systemService.getDefaultRPC();
    return new BaseResult(data);
  }
}
