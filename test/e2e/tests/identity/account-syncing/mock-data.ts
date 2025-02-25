import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { UserStorageResponseData } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { IDENTITY_TEAM_STORAGE_KEY } from '../constants';
import { createEncryptedResponse } from '../../../helpers/identity/user-storage/generateEncryptedData';
import { UserStorageAccount } from './helpers';

/**
 * This array represents the accounts mock data before it is encrypted and sent to UserStorage.
 * Each object within the array represents a UserStorageAccount, which includes properties such as:
 * - v: The version of the User Storage.
 * - a: The address of the account.
 * - i: The id of the account.
 * - n: The name of the account.
 * - nlu: The name last updated timestamp of the account.
 */
export const accountsToMockForAccountsSync: UserStorageAccount[] = [
  {
    v: '1',
    a: '0xAa4179E7f103701e904D27DF223a39Aa9c27405a'.toLowerCase(),
    i: '0000-1111',
    n: 'Hello from account 1',
    nlu: 1738590287,
  },
  {
    v: '1',
    a: '0xd2a4aFe5c2fF0a16Bf81F77ba4201A8107AA874b'.toLowerCase(),
    i: '1111-1111',
    n: 'Hello from account 2',
    nlu: 1738590287,
  },
];

/**
 * Generates a mock response for account synchronization.
 *
 * This function asynchronously creates an encrypted mock response for each account
 * in the `accountsToMockForAccountsSync` array. The encrypted responses are created
 * using the `createEncryptedMockResponse` function, which takes a configuration object
 * containing the account data, a storage key, and a feature key.
 *
 * @returns A promise that resolves to an array of encrypted mock responses.
 */
export const getAccountsSyncMockResponse = async (): Promise<
  UserStorageResponseData[]
> => {
  const encryptedResponse = await Promise.all(
    accountsToMockForAccountsSync.map((account) =>
      createEncryptedResponse({
        data: account,
        storageKey: IDENTITY_TEAM_STORAGE_KEY,
        path: `${USER_STORAGE_FEATURE_NAMES.accounts}.${account.a}`,
      }),
    ),
  );

  return encryptedResponse;
};
