import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { Configuration, ConfigurationSchema } from '@app/shared/models';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Configuration.name, schema: ConfigurationSchema },
    ]),
  ],
  providers: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}
