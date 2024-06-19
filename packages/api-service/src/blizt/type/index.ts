export type BliztSatus = 'start' | 'stop';

export enum BliztEvent {
  BLIZT_POINT = 'blizt-point',
  BLIZT_STATUS = 'blizt-status',
  BLIZT_TRANSACTION = 'blizt-transaction',
}
export interface TranctionLog {
  transactionHash: string;
  isSuccess: boolean;
}
