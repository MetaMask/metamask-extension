import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { expect } from '@playwright/test';
import { withFixtures, getCleanAppState } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';
import { completeNewWalletFlowIdentity } from '../flows';

import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACT_ADDRESSES } from './mock-data';

type Contact = {
  name: string;
  address: string;
  chainId?: string;
  memo?: string;
};

type AppState = {
  metamask: {
    isContactSyncingEnabled: boolean;
    hasAccountSyncingSyncedAtLeastOnce: boolean;
    addressBook?: Record<string, Record<string, Contact>>;
  };
};

describe('Contact syncing - New User', function () {
  this.timeout(120000); // Contact syncing tests can be long

  it('syncs contacts after new wallet creation', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    const testContact = {
      name: 'Test Contact',
      address: MOCK_CONTACT_ADDRESSES.ALICE,
    };

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // Setup contact syncing mock path
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.addressBook,
            server,
          );

          return mockIdentityServices(server, userStorageMockttpController);
        },
      },
      async ({ driver }) => {
        // Create new wallet and complete onboarding
        await completeNewWalletFlowIdentity(driver);

        // Wait for the UI to be ready before opening settings
        await driver.wait(async () => {
          const uiState = await getCleanAppState(driver);
          return uiState.metamask.hasAccountSyncingSyncedAtLeastOnce === true;
        }, 30000);

        // Set up test utilities
        const { waitUntilSyncedContactsNumberEquals } =
          arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

        // Add a test contact to trigger syncing
        const header = new HeaderNavbar(driver);
        await header.check_pageIsLoaded();

        // Add a small delay to ensure the menu is ready
        await driver.delay(1000);

        await header.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToContactsSettings();

        const contactsSettings = new ContactsSettings(driver);
        await contactsSettings.check_pageIsLoaded();

        // First, let's check if the page is actually showing the right content
        console.log('About to add contact...');
        await contactsSettings.addContact(
          testContact.name,
          testContact.address,
        );
        console.log('Contact added');

        // Wait for contact to be synced
        await waitUntilSyncedContactsNumberEquals(1);
        console.log('Contact synced');

        // Debug: Check the current state after adding contact
        const currentState = await driver.executeScript(() =>
          (
            window as {
              stateHooks?: {
                getCleanAppState?: () => AppState;
              };
            }
          ).stateHooks?.getCleanAppState?.(),
        );
        console.log('Current state after adding contact:', {
          isContactSyncingEnabled:
            currentState?.metamask?.isContactSyncingEnabled,
          addressBook: currentState?.metamask?.addressBook,
        });

        // Verify contact was added locally and synced
        await contactsSettings.check_contactDisplayed({
          contactName: testContact.name,
          address: '0x12345...67890', // Properly shortened address format
        });

        console.log('Contact syncing test completed successfully');
      },
    );
  });

  it('handles empty remote storage during initialization', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          userStorageMockttpController.setupPath(
            USER_STORAGE_FEATURE_NAMES.addressBook,
            server,
            {
              getResponse: [], // Empty remote storage
            },
          );
          return mockIdentityServices(server, userStorageMockttpController);
        },
      },
      async ({ driver }) => {
        await completeNewWalletFlowIdentity(driver);

        // Wait for contact syncing to initialize
        await driver.wait(async () => {
          const uiState = await driver.executeScript(() =>
            (
              window as {
                stateHooks?: {
                  getCleanAppState?: () => AppState;
                };
              }
            ).stateHooks?.getCleanAppState?.(),
          );
          return uiState?.metamask?.isContactSyncingEnabled === true;
        }, 15000);

        // Verify contact syncing is enabled even with empty storage
        const finalState = await driver.executeScript(() =>
          (
            window as {
              stateHooks?: {
                getCleanAppState?: () => AppState;
              };
            }
          ).stateHooks?.getCleanAppState?.(),
        );

        expect(finalState.metamask.isContactSyncingEnabled).toBe(true);
        console.log(
          'Contact syncing initialized successfully with empty remote storage',
        );
      },
    );
  });
});
