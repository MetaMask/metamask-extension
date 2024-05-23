import encryption, { createSHA256Hash } from '../encryption';

export const MOCK_STORAGE_KEY_SIGNATURE = 'mockStorageKey';
export const MOCK_STORAGE_KEY = createSHA256Hash(MOCK_STORAGE_KEY_SIGNATURE);
export const MOCK_STORAGE_DATA = JSON.stringify({ hello: 'world' });
export const MOCK_ENCRYPTED_STORAGE_DATA = encryption.encryptString(
  MOCK_STORAGE_DATA,
  MOCK_STORAGE_KEY,
);
