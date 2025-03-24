import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { Driver } from '../../../webdriver/driver';

export type UserStorageAccount = {
  /**
   * The Version 'v' of the User Storage.
   * NOTE - will allow us to support upgrade/downgrades in the future
   */
  v: string;
  /** the id 'i' of the account */
  i: string;
  /** the address 'a' of the account */
  a: string;
  /** the name 'n' of the account */
  n: string;
  /** the nameLastUpdatedAt timestamp 'nlu' of the account */
  nlu?: number;
};

export const waitUntilSyncedAccountsNumberEquals = async (
  expectedNumber: number,
  options: {
    driver: Driver;
    userStorageMockttpController: UserStorageMockttpController;
    timeout?: number;
    interval?: number;
  },
): Promise<void> => {
  const {
    driver,
    userStorageMockttpController,
    timeout = 30000,
    interval = 1000,
  } = options;
  await driver.waitUntil(
    async () => {
      const accounts = userStorageMockttpController.paths.get(
        USER_STORAGE_FEATURE_NAMES.accounts,
      )?.response;
      return accounts?.length === expectedNumber;
    },
    {
      timeout,
      interval,
    },
  );
};
