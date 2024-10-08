export enum FuelEvents {
  TOTAL_ONLINE = 'TOTAL_ONLINE',
  CURRENT_POOL = 'CURRENT_POOL',
  TOTAL_POINT = 'TOTAL_POINT',
  CURRENT_JOINED_POOL = 'CURRENT_JOINED_POOL',
  CREATE_POOL_TX_HASH = 'CREATE_POOL_TX_HASH',
  WINNER = 'WINNER',
}
export enum FuelWheelStatus {
  'CREATED' = 'CREATED', // Created wheel when the pool is created
  'RUNNING' = 'RUNNING', // Rotating wheel
  'WAITING' = 'WAITING', // Waiting for the next round to start new pool
}
