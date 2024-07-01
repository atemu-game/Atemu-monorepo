import { config } from 'dotenv';
import { RpcProviderSetting } from './constants';
import { ChainName } from './constants/setting';

config();
config({ path: '../../.env' });
export default () => ({
  // PATH Setup
  DB_PATH: String(process.env.DB_PATH),
  API_PORT: Number(process.env.API_PORT) || 8088,
  SOCKET_PORT: Number(process.env.SOCKET_PORT) || 8000,

  // JWT Setup
  JWT_SECRET: String(process.env.JWT_SECRET),
  JWT_EXPIRE: String(process.env.JWT_EXPIRE),
  // Encrypt Setup
  SECRET_KEY_ENCRYPT: String(process.env.SECRET_KEY_ENCRYPT), /// Key Encrypto privatekey
  SECRET_IV_ENCRYPT: String(process.env.SECRET_IV_ENCRYPT),
  SECRET_ENCRYPT_METHOD: String(process.env.SECRET_ENCRYPT_METHOD),

  // RPC - Enviroment
  RPC_URL: String(process.env.RPC_URL) || RpcProviderSetting.TESTNET,
  CHAIN_ID: String(process.env.CHAIN_ID) || ChainName.SN_SEPOLIA,
  // RPC - Provider
  PRIVATE_KEY: String(process.env.PRIVATE_KEY),
  ACCOUNT_ADDRESS: String(process.env.ACCOUNT_ADDRESS),
});
