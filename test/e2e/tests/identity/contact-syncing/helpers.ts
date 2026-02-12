import { Driver } from '../../../webdriver/driver';
import { getCleanAppState } from '../../../helpers';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
  AsEnum,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';

export type UserStorageContact = {
  v: string; // version
  a: string; // address
  c: string; // chainId
  n: string; // name
  m?: string; // memo
  lu: number; // lastUpdatedAt
};

/**
 * Arranges test utilities for contact syncing tests
 *
 * @param driver - The WebDriver instance
 * @param userStorageMockttpController - The mock server controller
 * @returns Object with utility functions for testing contact syncing
 */
export function arrangeContactSyncingTestUtils(
  driver: Driver,
  userStorageMockttpController: UserStorageMockttpController,
) {
  /**
   * Waits until the synced contacts count equals the expected number
   *
   * @param expectedContactsCount - Expected number of synced contacts
   * @param timeout - Timeout in milliseconds (default: 30000)
   */
  const waitUntilSyncedContactsNumberEquals = async (
    expectedContactsCount: number,
    timeout = 30000,
  ) => {
    await driver.wait(async () => {
      const uiState = await getCleanAppState(driver);

      // Try to get contacts from AddressBookController state
      const addressBookState = uiState?.metamask?.addressBook;
      if (!addressBookState) {
        console.log('AddressBook state not found, contacts count: 0');
        return expectedContactsCount === 0;
      }

      // Count valid contacts (exclude entries without proper data)
      let validContactsCount = 0;
      if (typeof addressBookState === 'object' && addressBookState !== null) {
        // AddressBook structure is { chainId: { address: contactObject } }
        for (const chainId in addressBookState) {
          if (Object.prototype.hasOwnProperty.call(addressBookState, chainId)) {
            if (chainId === '*') {
              continue; // Skip wildcard entries
            }

            const chainContacts = addressBookState[chainId];
            if (typeof chainContacts === 'object' && chainContacts !== null) {
              for (const address in chainContacts) {
                if (
                  Object.prototype.hasOwnProperty.call(chainContacts, address)
                ) {
                  const contact = chainContacts[address];
                  if (
                    contact?.chainId &&
                    contact.chainId !== '*' &&
                    contact.name?.trim() &&
                    contact.address
                  ) {
                    validContactsCount += 1;
                  }
                }
              }
            }
          }
        }
      }

      console.log(
        `Current synced contacts count: ${validContactsCount}, expected: ${expectedContactsCount}`,
      );
      return validContactsCount === expectedContactsCount;
    }, timeout);
  };

  /**
   * Waits until contact syncing has completed at least once
   *
   * @param timeout - Timeout in milliseconds (default: 30000)
   */
  const waitUntilContactSyncingCompleted = async (timeout = 30000) => {
    await driver.wait(async () => {
      const uiState = await getCleanAppState(driver);
      return uiState.metamask.isContactSyncingInProgress === false;
    }, timeout);
  };

  /**
   * Gets the current contacts from the address book
   */
  const getCurrentContacts = async () => {
    const uiState = await getCleanAppState(driver);
    const addressBookState = uiState?.metamask?.addressBook;

    if (!addressBookState) {
      return [];
    }

    const contacts = [];
    // AddressBook structure is { chainId: { address: contactObject } }
    for (const chainId in addressBookState) {
      if (Object.prototype.hasOwnProperty.call(addressBookState, chainId)) {
        if (chainId === '*') {
          continue; // Skip wildcard entries
        }

        const chainContacts = addressBookState[chainId];
        if (typeof chainContacts === 'object' && chainContacts !== null) {
          for (const address in chainContacts) {
            if (Object.prototype.hasOwnProperty.call(chainContacts, address)) {
              const contact = chainContacts[address];
              if (
                contact?.chainId &&
                contact.chainId !== '*' &&
                contact.name?.trim() &&
                contact.address
              ) {
                contacts.push(contact);
              }
            }
          }
        }
      }
    }

    return contacts;
  };

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

  return {
    waitUntilSyncedContactsNumberEquals,
    waitUntilContactSyncingCompleted,
    getCurrentContacts,
    prepareEventsEmittedCounter,
  };
}
