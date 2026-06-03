import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { IDENTITY_TEAM_STORAGE_KEY } from '../constants';
import { createEncryptedResponse } from '../../../helpers/identity/user-storage/generateEncryptedData';

/**
 * Mock account data for testing account syncing
 */
export const accountsToMockForAccountsSync = [
  {
    i: '5c33c40e-cb3e-4937-9c0f-4b81e8f5a8d7',
    a: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
    n: 'Account 1',
    v: '1',
  },
  {
    i: 'f1b8a3b2-4c1d-4e5f-8a9b-1c2d3e4f5a6b',
    a: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
    n: 'Account 2',
    v: '1',
  },
];

/**
 * Generates encrypted mock response for account syncing tests
 *
 * @returns Array of encrypted account data
 */
export async function getAccountsSyncMockResponse() {
  return Promise.all(
    accountsToMockForAccountsSync.map((account) =>
      createEncryptedResponse({
        data: account,
        storageKey: IDENTITY_TEAM_STORAGE_KEY,
        path: `${USER_STORAGE_FEATURE_NAMES.accounts}.${account.a}`,
      }),
    ),
  );
}
