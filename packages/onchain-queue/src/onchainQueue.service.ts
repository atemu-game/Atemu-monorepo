import { Injectable } from '@nestjs/common';
import { LogsReturnValues } from 'web3/src/types';
import { ChainDocument } from '@app/shared/models';

@Injectable()
export abstract class OnchainQueueService {
  abstract processEvent: (
    log: LogsReturnValues,
    chain: ChainDocument,
    timestamp?: number,
  ) => Promise<void>;
}
