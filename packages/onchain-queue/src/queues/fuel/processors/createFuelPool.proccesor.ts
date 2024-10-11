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
import { FuelService } from '../fuel.service';

@Processor(ONCHAIN_QUEUES.QUEUE_CREATE_POOL)
export class CreateFuelPoolProcessor {
  constructor(
    private readonly onQueueService: FuelService,

    @InjectModel(Chains.name) private chainModel: Model<ChainDocument>,
    @InjectQueue(ONCHAIN_QUEUES.QUEUE_CREATE_POOL)
    private readonly queue: Queue<LogsReturnValues>,
  ) {}
  logger = new Logger(CreateFuelPoolProcessor.name);
  @Process({ name: ONCHAIN_JOB.JOB_CREATE_POOL, concurrency: 10 })
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
      this.logger.error(
        `Failed to detect tx hash create fuel pool ${event.transaction_hash}`,
      );
      this.queue.add(ONCHAIN_JOB.JOB_CREATE_POOL, event);
    }
  }
}
