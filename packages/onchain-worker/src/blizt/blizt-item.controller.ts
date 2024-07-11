import { Controller } from '@nestjs/common';
import { BlockDetectService } from './block-detect.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blocks,
  BlockDocument,
  ChainDocument,
  Chains,
} from '@app/shared/models';
import { Model } from 'mongoose';

import { InjectQueue } from '@nestjs/bull';

import { Queue } from 'bull';
import { ONCHAIN_QUEUES } from '@app/shared/constants/queue';
import { LogsReturnValues } from 'web3/src/types';
import { Web3Service } from 'web3/src/web3.service';
import { OnchainWorkerQueueService } from '../queue/onchainWorkerQueue';

@Controller('user-item')
export class BliztItemController {
  constructor(
    @InjectModel(Chains.name) private readonly chainModel: Model<ChainDocument>,
    @InjectModel(Blocks.name) private readonly blockModel: Model<BlockDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_ADD_POINT)
    private readonly addPointQueue: Queue<LogsReturnValues>,

    private readonly web3Service: Web3Service,
    private readonly onchainQueueService: OnchainWorkerQueueService,
  ) {
    if (!this.listeners) this.init();
  }
  listeners: BlockDetectService[];

  async init() {
    const chains = await this.chainModel.find();

    this.listeners = chains
      .filter((chain) => chain.rpc)
      .map(
        (chain) =>
          new BlockDetectService(
            this.onchainQueueService,
            this.blockModel,
            this.web3Service,
            chain,
            this.addPointQueue,
          ),
      );

    for (const job of this.listeners) {
      job.start();
    }
  }
}
