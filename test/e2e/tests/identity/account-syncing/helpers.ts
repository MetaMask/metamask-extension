import { USER_STORAGE_GROUPS_FEATURE_KEY } from '@metamask/account-tree-controller';
import { Driver } from '../../../webdriver/driver';
import {
  AsEnum,
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';

export const arrangeTestUtils = (
  driver: Driver,
  userStorageMockttpController: UserStorageMockttpController,
) => {
  const BASE_TIMEOUT = 40000;
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
          USER_STORAGE_GROUPS_FEATURE_KEY,
        )?.response;
        const currentCount = accounts?.length ?? 0;
        if (currentCount !== expectedNumber) {
          console.log(
            `Current synced accounts: ${currentCount}, expected: ${expectedNumber}. Accounts:`,
            JSON.stringify(accounts),
          );
        }
        return currentCount === expectedNumber;
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
