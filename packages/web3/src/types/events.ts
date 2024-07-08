import { SuccessfulTransactionReceiptResponse } from 'starknet';
export enum EventType {
  AddPoint = 'AddPoint',
}

export enum EventTopic {
  ADD_POINT = '0x354d77737a9da212785dc01df24a905745e2ed0cbfb5d04c86f8cd94372c4f6',
}
export type LogsReturnValues = SuccessfulTransactionReceiptResponse & {
  returnValues: any;
  eventType: EventType;
};
