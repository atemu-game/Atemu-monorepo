import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

@ApiTags('Userconfig')
@Controller('userconfig')
export class UserconfigController {
  constructor() {}
}
