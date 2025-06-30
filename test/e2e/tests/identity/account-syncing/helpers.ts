import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
  AsEnum,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
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

export const arrangeTestUtils = (
  driver: Driver,
  userStorageMockttpController: UserStorageMockttpController,
) => {
  const BASE_TIMEOUT = 30000;
  const BASE_INTERVAL = 1000;

  const prepareEventsEmittedCounter = (
    event: AsEnum<typeof UserStorageMockttpControllerEvents>,
  ) => {
    let counter = 0;
    userStorageMockttpController.eventEmitter.on(event, () => {
      counter += 1;
    });

    const waitUntilEventsEmittedNumberEquals = async (
      expectedNumber: number,
    ) => {
      console.log(
        `Waiting for user storage event ${event} to be emitted ${expectedNumber} times`,
      );
      await driver.waitUntil(async () => counter >= expectedNumber, {
        timeout: BASE_TIMEOUT,
        interval: BASE_INTERVAL,
      });
    };
    return { waitUntilEventsEmittedNumberEquals };
  };

  const waitUntilSyncedAccountsNumberEquals = async (
    expectedNumber: number,
  ) => {
    console.log(
      `Waiting for user storage number of accounts synced to be ${expectedNumber}`,
    );
    await driver.waitUntil(
      async () => {
        const accounts = userStorageMockttpController.paths.get(
          USER_STORAGE_FEATURE_NAMES.accounts,
        )?.response;
        return accounts?.length === expectedNumber;
      },
      {
        timeout: BASE_TIMEOUT,
        interval: BASE_INTERVAL,
      },
    );
  };

  return {
    prepareEventsEmittedCounter,
    waitUntilSyncedAccountsNumberEquals,
  };
};
