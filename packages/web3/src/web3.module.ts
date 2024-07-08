import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';

@Module({
  imports: [],
  controllers: [Web3Service],
  providers: [Web3Service],
})
export class Web3Module {}
