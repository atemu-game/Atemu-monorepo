import { config } from 'dotenv';
import { RpcProviderSetting } from './constants';
import { ChainName } from './constants/setting';

config();
config({ path: '../../.env' });
export default () => ({
  // PATH Setup
  DB_PATH: String(process.env.DB_PATH),
  // API Port
  API_PORT: Number(process.env.API_PORT) || 8000,
  BLIZT_GATEWAY_PORT: Number(process.env.BLIZT_GATEWAY_PORT) || 5050,
  FUEL_GATEWAY_PORT: Number(process.env.FUEL_GATEWAY_PORT) || 5051,
  // ONCHAIN Setup
  ONCHAIN_QUEUE_PORT: Number(process.env.ONCHAIN_QUEUE_PORT) || 8089,
  ONCHAIN_WORKER_PORT: Number(process.env.ONCHAIN_WORKER_PORT) || 8090,
  OFFCHAIN_WORKER_PORT: Number(process.env.OFFCHAIN_WORKER_PORT) || 8091,

  // JWT Setup
  JWT_SECRET: String(process.env.JWT_SECRET),
  JWT_EXPIRE: String(process.env.JWT_EXPIRE),
  // Encrypt Setup
  SECRET_KEY_ENCRYPT: String(process.env.SECRET_KEY_ENCRYPT), /// Key Encrypto privatekey
  SECRET_IV_ENCRYPT: String(process.env.SECRET_IV_ENCRYPT),
  SECRET_ENCRYPT_METHOD: String(process.env.SECRET_ENCRYPT_METHOD),

  // RPC - Enviroment
  RPC_URL: String(process.env.RPC_URL) || RpcProviderSetting.TESTNET,
  CHAIN_ID: ChainName.SN_SEPOLIA,
  // RPC - Provider
  PRIVATE_KEY: String(process.env.PRIVATE_KEY),
  ACCOUNT_ADDRESS: String(process.env.ACCOUNT_ADDRESS),

  IPFS_GATEWAY: String(process.env.IPFS_GATEWAY),

  BEGIN_BLOCK: Number(process.env.BEGIN_BLOCK),

  QUEUE_HOST: String(process.env.QUEUE_HOST),
  QUEUE_PORT: Number(process.env.QUEUE_PORT),
});
