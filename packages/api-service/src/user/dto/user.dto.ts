import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateInfoReqDTO {
  @ApiProperty()
  @IsEmail()
  email?: string;

  // @ApiProperty()
  // @IsUrl()
  // avatar?: string;

  // @ApiProperty()
  // @IsUrl()
  // cover?: string;

  // @ApiProperty()
  // @IsString()
  // about?: string;
}
