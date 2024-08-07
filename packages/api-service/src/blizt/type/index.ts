export type BliztSatus =
  | 'starting'
  | 'started'
  | 'stopped'
  | 'stopping'
  | 'balance_low';

export enum BliztEvent {
  BLIZT_POINT = 'blizt-point',
  BLIZT_STATUS = 'blizt-status',
  BLIZT_TRANSACTION = 'blizt-transaction',
  BLIZT_BALANCE = 'blizt-balance',
}
export interface TranctionLog {
  transactionHash: string;
  isSuccess: boolean;
}
