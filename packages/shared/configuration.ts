import { config } from 'dotenv';
import { RPC_PROVIDER } from './constants';
import { CHAIN_ID } from './constants/chain';

config();
config({ path: '../../.env' });
export default () => ({
  DB_PATH: String(process.env.DB_PATH) || 'mongodb://localhost:27017/atemu',
  API_PORT: Number(process.env.API_PORT) || 8088,

  // JWT Setup
  JWT_SECRET: String(process.env.JWT_SECRET) || 'jwt secret key',
  JWT_EXPIRE: String(process.env.JWT_EXPIRE) || '1d',
  // Encrypt Setup
  SECRET_KEY_ENCRYPT:
    String(process.env.SECRET_KEY_ENCRYPT) ||
    '12345678901234567890123456789012', /// Key Encrypto privatekey
  SECRET_IV_ENCRYPT:
    String(process.env.SECRET_IV_ENCRYPT) || '12345678901234567890123456789012',
  SECRET_ENCRYPT_METHOD:
    String(process.env.SECRET_ENCRYPT_METHOD) || 'aes-256-gcm',

  // RPC - Enviroment
  RPC_URL: String(process.env.RPC_URL) || RPC_PROVIDER.TESTNET,
  CHAIN_ID: String(process.env.CHAIN_ID) || CHAIN_ID.SN_SEPOLIA,
});
