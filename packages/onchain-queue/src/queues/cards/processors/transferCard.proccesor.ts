import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ONCHAIN_JOB, ONCHAIN_QUEUES } from '@app/shared/constants/queue';
import { Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { LogsReturnValues } from 'web3/src/types';
import { ChainDocument, Chains } from '@app/shared/models';
import { retryUntil } from '@app/shared/index';
import { CardService } from '../cards.service';

@Processor(ONCHAIN_QUEUES.QUEUE_TRANSFER_CARD)
export class TransferCardProcessor {
  constructor(
    private readonly onQueueService: CardService,

    @InjectModel(Chains.name) private chainModel: Model<ChainDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_TRANSFER_CARD)
    private readonly queue: Queue<LogsReturnValues>,
  ) {}
  logger = new Logger(TransferCardProcessor.name);
  @Process({ name: ONCHAIN_JOB.JOB_TRANSFER_CARD, concurrency: 10 })
  async detectEv(job: Job<LogsReturnValues>) {
    const event = job.data;
    const maxRetry = 10;
    const chain = await this.chainModel.findOne();
    try {
      await retryUntil(
        async () => await this.onQueueService.processEvent(event, chain),
        () => true,
        maxRetry,
      );
    } catch (error) {
      this.logger.error(`Failed to detect tx hash ${event.transaction_hash}`);
      this.queue.add(ONCHAIN_JOB.JOB_TRANSFER_CARD, event);
    }
  }
}
