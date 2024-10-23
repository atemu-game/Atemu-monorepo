import { MongooseModule } from '@nestjs/mongoose';
import { ClaimPoint, ClaimPointSchema } from '@app/shared/models';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClaimPointController } from './claimPoint.controller';
import { ClaimPointService } from './claimPoint.service';
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: ClaimPoint.name, schema: ClaimPointSchema },
    ]),
  ],
  controllers: [ClaimPointController],
  providers: [ClaimPointService],
})
export class ClaimPointModule {}
