import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { expect } from '@playwright/test';
import { withFixtures, getCleanAppState, unlockWallet } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';
import BackupAndSyncSettings from '../../../page-objects/pages/settings/backup-and-sync-settings';
import { arrangeContactSyncingTestUtils } from './helpers';

describe('Contact Syncing - Backup and Sync Settings', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  describe('from inside MetaMask', function () {
    it('does not sync contact changes when contact syncing is turned off', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.addressBook,
              server,
            );

            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();

          // Wait for the UI to be ready before opening settings
          await driver.wait(async () => {
            const uiState = await getCleanAppState(driver);
            return uiState.metamask.hasAccountSyncingSyncedAtLeastOnce === true;
          }, 30000);

          await header.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToBackupAndSyncSettings();

          const backupAndSyncSettingsPage = new BackupAndSyncSettings(driver);
          await backupAndSyncSettingsPage.check_pageIsLoaded();

          // Verify backup and sync is initially enabled
          const initialState = await driver.executeScript(() =>
            (
              window as {
                stateHooks?: {
                  getCleanAppState?: () => {
                    metamask: {
                      isBackupAndSyncEnabled: boolean;
                      isContactSyncingEnabled: boolean;
                    };
                  };
                };
              }
            ).stateHooks?.getCleanAppState?.(),
          );
          console.log('Initial backup and sync state:', {
            isBackupAndSyncEnabled:
              initialState.metamask.isBackupAndSyncEnabled,
            isContactSyncingEnabled:
              initialState.metamask.isContactSyncingEnabled,
          });

          // Turn off contact syncing specifically
          await backupAndSyncSettingsPage.toggleContactSync();

          // Wait for the state change to propagate
          await driver.delay(2000);

          // Verify contact syncing is now disabled
          const disabledState = await driver.executeScript(() =>
            (
              window as {
                stateHooks?: {
                  getCleanAppState?: () => {
                    metamask: {
                      isBackupAndSyncEnabled: boolean;
                      isContactSyncingEnabled: boolean;
                    };
                  };
                };
              }
            ).stateHooks?.getCleanAppState?.(),
          );
          console.log('Disabled contact sync state:', {
            isBackupAndSyncEnabled:
              disabledState.metamask.isBackupAndSyncEnabled,
            isContactSyncingEnabled:
              disabledState.metamask.isContactSyncingEnabled,
          });

          // Contact syncing should be disabled
          expect(disabledState.metamask.isContactSyncingEnabled).toBe(false);

          // Set up event counter to verify NO PUT request is made
          const { prepareEventsEmittedCounter } =
            arrangeContactSyncingTestUtils(
              driver,
              userStorageMockttpController,
            );
          const { waitUntilEventsEmittedNumberEquals } =
            prepareEventsEmittedCounter(
              UserStorageMockttpControllerEvents.PUT_SINGLE,
            );

          // Add a new contact via UI (like the account syncing test does)
          const settingsPage2 = new SettingsPage(driver);
          await settingsPage2.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();

          await contactsSettings.addContact(
            'New Contact Not Synced',
            '0x9999999999999999999999999999999999999999',
          );

          console.log('Added contact via UI when contact sync is disabled');

          // Wait a bit and verify that NO PUT request was made (contact sync is disabled)
          await driver.delay(5000); // Wait 5 seconds
          await waitUntilEventsEmittedNumberEquals(0);

          console.log(
            'Verified no sync requests were made when contact syncing is disabled',
          );
        },
      );

      // Launch a new instance to verify the change wasn't synced
      await withFixtures(
        {
          fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.addressBook,
              server,
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          const { getCurrentContacts } = arrangeContactSyncingTestUtils(
            driver,
            userStorageMockttpController,
          );

          // Wait a moment for any potential syncing to complete
          await driver.delay(5000);

          // Verify the contact list doesn't have the contact we added when sync was disabled
          const finalContacts = await getCurrentContacts();
          console.log(
            'Final contacts after new instance:',
            finalContacts.length,
          );

          // Verify we don't have the contact we added when contact sync was disabled
          const hasNewContact = finalContacts.some(
            (contact: { address: string }) =>
              contact.address === '0x9999999999999999999999999999999999999999',
          );
          expect(hasNewContact).toBe(false);

          console.log(
            'Verified contact was not synced to new instance when contact syncing was disabled',
          );
        },
      );
    });

    it('enables contact syncing when backup and sync is turned on', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder().withBackupAndSyncSettings().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.addressBook,
              server,
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();

          // Wait for the UI to be ready before opening settings
          await driver.wait(async () => {
            const uiState = await getCleanAppState(driver);
            return uiState.metamask.hasAccountSyncingSyncedAtLeastOnce === true;
          }, 30000);

          await header.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToBackupAndSyncSettings();

          const backupAndSyncSettingsPage = new BackupAndSyncSettings(driver);
          await backupAndSyncSettingsPage.check_pageIsLoaded();

          // Verify backup and sync settings are available and contact syncing is enabled
          const initialState = await driver.executeScript(() =>
            (
              window as {
                stateHooks?: {
                  getCleanAppState?: () => {
                    metamask: {
                      isBackupAndSyncEnabled: boolean;
                      isContactSyncingEnabled: boolean;
                    };
                  };
                };
              }
            ).stateHooks?.getCleanAppState?.(),
          );

          console.log('Initial backup and sync state:', {
            isBackupAndSyncEnabled:
              initialState.metamask.isBackupAndSyncEnabled,
            isContactSyncingEnabled:
              initialState.metamask.isContactSyncingEnabled,
          });

          // Both backup and sync and contact syncing should be enabled by default
          expect(initialState.metamask.isBackupAndSyncEnabled).toBe(true);
          expect(initialState.metamask.isContactSyncingEnabled).toBe(true);

          // Set up event counter to verify PUT request IS made when sync is enabled
          const { prepareEventsEmittedCounter } =
            arrangeContactSyncingTestUtils(
              driver,
              userStorageMockttpController,
            );
          const { waitUntilEventsEmittedNumberEquals } =
            prepareEventsEmittedCounter(
              UserStorageMockttpControllerEvents.PUT_SINGLE,
            );

          // Add a new contact via UI to test that syncing works when enabled
          const settingsPage2 = new SettingsPage(driver);
          await settingsPage2.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();
          await contactsSettings.addContact(
            'New Contact Synced',
            '0x8888888888888888888888888888888888888888',
          );

          console.log('Added contact via UI when contact sync is enabled');

          // Verify that a PUT request WAS made (contact sync is enabled)
          await waitUntilEventsEmittedNumberEquals(1);

          console.log(
            'Verified sync request was made when contact syncing is enabled',
          );
        },
      );
    });
  });
});
