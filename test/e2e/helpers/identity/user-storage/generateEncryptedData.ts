import {
  Encryption,
  UserStoragePathWithFeatureAndKey,
  createSHA256Hash,
  getFeatureAndKeyFromPath,
} from '@metamask/profile-sync-controller/sdk';
import { MOCK_SRP_E2E_IDENTIFIER_BASE_KEY } from '../../../tests/identity/mocks';
import { UserStorageResponseData } from './userStorageMockttpController';

/**
 * Encrypts the given data object using the specified storage key.
 *
 * @param data - The data object to be encrypted.
 * @param storageKey - The key used for encryption.
 * @returns A promise that resolves to the encrypted string.
 */
const encryptData = async (
  data: object,
  storageKey: string,
): Promise<string> => {
  return await Encryption.encryptString(JSON.stringify(data), storageKey);
};

/**
 * Generates an encrypted hash using the provided user storage path and storage key.
 *
 * @param path - The user storage path which includes the feature and key.
 * @param storageKey - The storage key to be used in the hash generation.
 * @returns The generated SHA-256 hash as a string.
 */
const generateEncryptedHash = (
  path: UserStoragePathWithFeatureAndKey,
  storageKey: string,
): string => {
  const { key: featureKey } = getFeatureAndKeyFromPath(path);
  return createSHA256Hash(featureKey + storageKey);
};

/**
 * Creates an encrypted response object containing a hashed key and encrypted data.
 * This will simulate how our clients will encrypt data before sending to our User Storagrget
 *
 * @param options - The options for creating the encrypted response.
 * @param options.data - The data to be encrypted.
 * @param options.storageKey - The key used for encryption.
 * @param options.path - The user storage path with feature and key.
 * @param options.srpIdentifierNumber - Optional identifier number for SRP. Used to determine which SRP storage space to use.
 * @returns A promise that resolves to an object containing the hashed key and encrypted data.
 */
export const createEncryptedResponse = async (options: {
  data: object;
  storageKey: string;
  path: UserStoragePathWithFeatureAndKey;
  srpIdentifierNumber?: number;
}): Promise<UserStorageResponseData> => {
  const { data, storageKey: key, path, srpIdentifierNumber = 1 } = options;
  return {
    HashedKey: generateEncryptedHash(path, key),
    Data: await encryptData(data, key),
    // By default, encrypted data will be stored in the primary SRP storage space
    SrpIdentifier: `${MOCK_SRP_E2E_IDENTIFIER_BASE_KEY}_${srpIdentifierNumber}`,
  };
};
