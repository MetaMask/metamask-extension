import { Browser } from 'selenium-webdriver';
import { USER_STORAGE_GROUPS_FEATURE_KEY } from '@metamask/account-tree-controller';
import { Driver } from '../../../webdriver/driver';
import {
  AsEnum,
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';

// Syncing can take some time (specially in Firefox) so adding a longer timeout to reduce flakes
export const BASE_ACCOUNT_SYNC_TIMEOUT = 30000;
export const BASE_ACCOUNT_SYNC_INTERVAL = 1000;

// Extra delay to wait after unlock before checking sync state (helps with Firefox timing issues)
export const POST_UNLOCK_DELAY = 20000;

/**
 * Skips the current test if running on Firefox.
 * Account syncing tests are flaky on Firefox due to timing issues.
 *
 * @param context - The Mocha test context (this)
 */
export function skipOnFirefox(context: Mocha.Context): void {
  if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
    console.log('Skipping test on Firefox due to timing issues');
    context.skip();
  }
}

export const arrangeTestUtils = (
  driver: Driver,
  userStorageMockttpController: UserStorageMockttpController,
) => {
  const prepareEventsEmittedCounter = (
    event: AsEnum<typeof UserStorageMockttpControllerEvents>,
  ) => {
    let counter = 0;
    userStorageMockttpController.eventEmitter.on(event, () => {
      counter += 1;
      console.log(
        `[UserStorage Event] ${event} emitted. Total count: ${counter}`,
      );
    });

    const waitUntilEventsEmittedNumberEquals = async (
      expectedNumber: number,
    ) => {
      console.log(
        `Waiting for user storage event ${event} to be emitted ${expectedNumber} times (current: ${counter})`,
      );
      await driver.waitUntil(async () => counter >= expectedNumber, {
        timeout: BASE_ACCOUNT_SYNC_TIMEOUT,
        interval: BASE_ACCOUNT_SYNC_INTERVAL,
      });
      console.log(
        `User storage event ${event} reached expected count: ${expectedNumber}`,
      );
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
        timeout: BASE_ACCOUNT_SYNC_TIMEOUT,
        interval: BASE_ACCOUNT_SYNC_INTERVAL,
      },
    );
    console.log(
      `User storage synced accounts reached expected count: ${expectedNumber}`,
    );
  };

  return {
    prepareEventsEmittedCounter,
    waitUntilSyncedAccountsNumberEquals,
  };
};
