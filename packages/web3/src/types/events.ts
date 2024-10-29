import { SuccessfulTransactionReceiptResponse } from 'starknet';
export enum EventType {
  AddPoint = 'AddPoint',
  TransferPoint = 'TransferPoint',
  CreatePool = 'CreatePool',
  JoiningPool = 'JoiningPool',
  ClaimReward = 'ClaimReward',
  MintCard = 'MintCard',
  BurnCard = 'BurnCard',
  TransferCard = 'TransferCard',
}

export enum EventTopic {
  ADD_POINT = '0x354d77737a9da212785dc01df24a905745e2ed0cbfb5d04c86f8cd94372c4f6',
  TRANSFER_POINT = '0x14b458c5a0a0d77cccbb50fe8aca56df27f2641d0c27fd9347bcf5f3124ac97',
  CREATE_POOL = '0x1c92936ee86444fa9ee6b4ff49b7b0ce0bc65c0b8b366bfed2b69dd0a825db4',
  JOINING_POOL = '0x8db3022db73c4277107c81309508a20687d75fce22ff278032b1001f5d067e',
  CLAIM_REWARD = '0x34a8f77cdc33d850e6c0675aa62fe4e670b96b2d1aa88f4873c1f7b35293c5c',
  TRANSFER_SINGLE = '0x182d859c0807ba9db63baf8b9d9fdbfeb885d820be6e206b9dab626d995c433',
  TRANSFER_BATCH = '0x2563683c757f3abe19c4b7237e2285d8993417ddffe0b54a19eb212ea574b08',
}
export type LogsReturnValues = SuccessfulTransactionReceiptResponse & {
  returnValues: any;
  eventType: EventType;
  index: number;
};
