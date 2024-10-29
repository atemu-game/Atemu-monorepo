import { SuccessfulTransactionReceiptResponse } from 'starknet';
import { TransactionWorkerStatus } from '../models';
import { EventType } from '@app/web3/types';

export type TransactionWorkerType = {
  txHash: string;
  status: TransactionWorkerStatus;
};

export type LogsReturnValues = SuccessfulTransactionReceiptResponse & {
  returnValues: any;
  eventType: EventType;
  index?: number;
};
