export const ONCHAIN_QUEUES = {
  QUEUE_ADD_POINT: 'QUEUE_ADD_POINT',
};

export const ONCHAIN_JOB = {
  JOB_ADD_POINT: 'JOB_ADD_POINT',
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
