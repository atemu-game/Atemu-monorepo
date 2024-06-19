import crypto from 'crypto';
import configuration from '../configuration';

// Encrypto and Decrypt data
const key = crypto
  .createHash('sha512')
  .update(configuration().SECRET_KEY_ENCRYPT)
  .digest('hex')
  .substring(0, 32);
const encryptionIV = crypto
  .createHash('sha512')
  .update(configuration().SECRET_IV_ENCRYPT)
  .digest('hex')
  .substring(0, 16);

export const encryptData = (data: string) => {
  const cipher = crypto.createCipheriv(
    configuration().SECRET_ENCRYPT_METHOD,
    key,
    encryptionIV,
  );

  return Buffer.from(
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex'),
  ).toString('base64'); // Encrypts data and converts to hex and base64
};

export const decryptData = (encryptedData) => {
  const buff = Buffer.from(encryptedData, 'base64');

  const decipher = crypto.createDecipheriv(
    configuration().SECRET_ENCRYPT_METHOD,
    key,
    encryptionIV,
  );

  return (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  ); // Decrypts data and converts to utf8
};
