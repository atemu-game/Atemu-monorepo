export const QUEUE_METADATA = 'metadata';

export const ONCHAIN_QUEUES = {
  QUEUE_ADD_POINT: 'QUEUE_ADD_POINT',
  QUEUE_TRANSFER_POINT: 'QUEUE_TRANSFER_POINT',
  QUEUE_CREATE_POOL: 'QUEUE_CREATE_POOL',
  QUEUE_JOIN_POOL: 'QUEUE_JOIN_POOL',
  QUEUE_CLAIM_FUEL_REWARD: 'QUEUE_CLAIM_FUEL_REWARD',
  QUEUE_MINT_CARD: 'QUEUE_MINT_CARD',
  QUEUE_TRANSFER_CARD: 'QUEUE_TRANSFER_CARD',
};

export const JOB_QUEUE_NFT_METADATA = 'fetch_metadata';

export const ONCHAIN_JOB = {
  JOB_ADD_POINT: 'JOB_ADD_POINT',
  JOB_TRANSFER_POINT: 'JOB_TRANSFER_POINT',
  JOB_CREATE_POOL: 'JOB_CREATE_POOL',
  JOB_JOIN_POOL: 'JOB_JOIN_POOL',
  JOB_CLAIM_FUEL_REWARD: 'JOB_CLAIM_FUEL_REWARD',
  JOB_MINT_CARD: 'JOB_MINT_CARD',
  JOB_TRANSFER_CARD: 'JOB_TRANSFER_CARD',
};

export const MQ_JOB_DEFAULT_CONFIG = {
  removeOnComplete: true,
  removeOnFail: {
    count: 1000, // keep up to 1000 jobs
  },
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};