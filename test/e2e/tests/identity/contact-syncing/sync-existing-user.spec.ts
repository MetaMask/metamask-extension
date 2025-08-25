import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { expect } from '@playwright/test';

import { withFixtures, getCleanAppState } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import {
  IDENTITY_TEAM_SEED_PHRASE,
  IDENTITY_TEAM_STORAGE_KEY,
} from '../constants';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { createEncryptedResponse } from '../../../helpers/identity/user-storage/generateEncryptedData';
import { completeOnboardFlowIdentity } from '../flows';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';

import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACTS, createContactKey } from './mock-data';

type Contact = {
  name: string;
  address: string;
  chainId: string;
  memo?: string;
};

describe('Contact Syncing - Existing User', function () {
  this.timeout(300000); // Extended timeout for comprehensive test

  // Test network chain ID - used throughout the test
  const testChainId = '0x539';

  const arrange = async () => {
    // Initial contacts that exist on remote storage (using test network chain ID)
    const initialRemoteContacts = [
      {
        ...MOCK_CONTACTS.ALICE_MAINNET,
        c: testChainId, // Use test network chain ID
      },
      {
        ...MOCK_CONTACTS.BOB_SEPOLIA,
        c: testChainId, // Use test network chain ID
      },
      {
        ...MOCK_CONTACTS.CHARLIE_POLYGON,
        c: testChainId, // Use test network chain ID
      },
    ];

    // New contact to be added during test
    const newContact = {
      name: 'David New Contact',
      address: '0x4567890123456789012345678901234567890123', // Use Diana's address (unique)
      memo: 'Newly added contact',
    };

    // Modified version of existing contact
    const modifiedContactName = 'Alice Smith Updated';

    // Expected final state after all operations
    const expectedFinalContacts = [
      {
        name: modifiedContactName, // Alice modified
        address: MOCK_CONTACTS.ALICE_MAINNET.a,
        chainId: testChainId,
      },
      {
        name: 'Charlie Brown', // Charlie unchanged
        address: MOCK_CONTACTS.CHARLIE_POLYGON.a,
        chainId: testChainId,
      },
      {
        name: newContact.name, // David added
        address: '0x4567890123456789012345678901234567890123',
        chainId: testChainId,
      },
      // Bob deleted - not in final state
    ];

    // Create encrypted responses for initial remote contacts
    const mockedContactSyncResponse = await Promise.all(
      initialRemoteContacts.map((contact) =>
        createEncryptedResponse({
          data: contact,
          storageKey: IDENTITY_TEAM_STORAGE_KEY,
          path: `${USER_STORAGE_FEATURE_NAMES.addressBook}.${createContactKey(
            contact,
          )}`,
        }),
      ),
    );

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      initialRemoteContacts,
      newContact,
      modifiedContactName,
      expectedFinalContacts,
      mockedContactSyncResponse,
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('performs complete lifecycle: remote→local contact sync, add, modify, delete, verify sync on other device', async function () {
      const {
        initialRemoteContacts,
        newContact,
        modifiedContactName,
        expectedFinalContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      // PHASE 1: First device - Complete contact lifecycle
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.addressBook,
              server,
              {
                getResponse: mockedContactSyncResponse,
              },
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          // Complete onboarding with existing SRP to get remote contacts
          await completeOnboardFlowIdentity(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(
              driver,
              userStorageMockttpController,
            );

          // STEP 1: Verify initial remote contacts are synced to local
          console.log('STEP 1: Waiting for initial remote contacts to sync...');
          await waitUntilSyncedContactsNumberEquals(
            initialRemoteContacts.length,
          );

          const contacts = await getCurrentContacts();
          expect(contacts.length).toBe(initialRemoteContacts.length);
          console.log(
            '✅ Initial remote contacts synced successfully:',
            contacts.length,
          );

          // Verify specific initial contacts
          const contactNames = contacts.map((contact: Contact) => contact.name);
          expect(contactNames).toContain('Alice Smith');
          expect(contactNames).toContain('Bob Johnson');
          expect(contactNames).toContain('Charlie Brown');

          // Set up UI navigation
          const header = new HeaderNavbar(driver);
          await header.checkPageIsLoaded();

          // Wait for the UI to be ready before opening settings
          await driver.wait(async () => {
            const uiState = await getCleanAppState(driver);
            return (
              uiState?.metamask?.hasAccountSyncingSyncedAtLeastOnce === true
            );
          }, 30000);

          const settingsPage = new SettingsPage(driver);
          const contactsSettings = new ContactsSettings(driver);

          // STEP 2: Add new contact
          console.log('STEP 2: Adding new contact...');
          await header.openSettingsPage();
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToContactsSettings();
          await contactsSettings.checkPageIsLoaded();
          await contactsSettings.addContact(
            newContact.name,
            newContact.address,
          );

          // Debug: Check if contact syncing is still enabled and not in progress
          const debugState = await driver.executeScript(() =>
            (
              window as {
                stateHooks?: {
                  getCleanAppState?: () => {
                    metamask: {
                      isContactSyncingEnabled: boolean;
                      isContactSyncingInProgress: boolean;
                      isBackupAndSyncEnabled: boolean;
                    };
                  };
                };
              }
            ).stateHooks?.getCleanAppState?.(),
          );
          console.log('Debug state after adding David:', {
            isContactSyncingEnabled:
              debugState.metamask.isContactSyncingEnabled,
            isContactSyncingInProgress:
              debugState.metamask.isContactSyncingInProgress,
            isBackupAndSyncEnabled: debugState.metamask.isBackupAndSyncEnabled,
          });

          // Debug: Check if David was actually added to the address book
          const contactsAfterAdd = await getCurrentContacts();
          console.log(
            'Contacts after adding David:',
            contactsAfterAdd.map((c: Contact) => ({
              name: c.name,
              address: c.address,
              chainId: c.chainId,
            })),
          );

          // Wait for new contact to sync
          console.log('Waiting for David to sync to remote storage...');
          await waitUntilSyncedContactsNumberEquals(
            initialRemoteContacts.length + 1,
          );

          console.log('✅ New contact added and synced');

          // STEP 3: Modify existing contact (Alice)
          console.log('STEP 3: Modifying existing contact...');

          // Navigate back to contacts list first
          await settingsPage.goToContactsSettings();
          await contactsSettings.checkPageIsLoaded();

          await contactsSettings.editContact({
            existingContactName: 'Alice Smith',
            newContactName: modifiedContactName,
            newContactAddress: MOCK_CONTACTS.ALICE_MAINNET.a,
          });

          // Wait for modification to sync
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            return updatedContacts.some(
              (contact: Contact) => contact.name === modifiedContactName,
            );
          }, 15000);
          console.log('✅ Contact modification synced');

          // STEP 4: Delete existing contact (Bob)
          console.log('STEP 4: Deleting existing contact...');
          await settingsPage.goToContactsSettings();
          await contactsSettings.checkPageIsLoaded();

          await contactsSettings.deleteContact('Bob Johnson');

          // Wait for deletion to sync
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            return !updatedContacts.some(
              (contact: Contact) => contact.name === 'Bob Johnson',
            );
          }, 15000);
          console.log('✅ Contact deletion synced');

          console.log('PHASE 1 complete - proceeding to second device test');
        },
      );

      // PHASE 2: Second device - Verify all changes are synced
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
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
          // Complete onboarding with existing SRP to get synced contacts
          await completeOnboardFlowIdentity(driver, IDENTITY_TEAM_SEED_PHRASE);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(
              driver,
              userStorageMockttpController,
            );

          // Wait for all contacts to sync
          await waitUntilSyncedContactsNumberEquals(
            expectedFinalContacts.length,
          );

          // Get final contacts and verify
          const finalContacts = await getCurrentContacts();
          console.log(
            'Final contacts on second device:',
            finalContacts.map((c: Contact) => ({
              name: c.name,
              address: c.address,
              chainId: c.chainId,
            })),
          );

          // Verify Alice (modified)
          const aliceContact = finalContacts.find(
            (contact: Contact) =>
              contact.address?.toLowerCase() ===
              MOCK_CONTACTS.ALICE_MAINNET.a.toLowerCase(),
          );
          expect(aliceContact?.name).toBe(modifiedContactName);

          // Verify Charlie (unchanged)
          const charlieContact = finalContacts.find(
            (contact: Contact) =>
              contact.address?.toLowerCase() ===
              MOCK_CONTACTS.CHARLIE_POLYGON.a.toLowerCase(),
          );
          expect(charlieContact?.name).toBe('Charlie Brown');

          // Verify David (new)
          const davidContact = finalContacts.find(
            (contact: Contact) =>
              contact.address?.toLowerCase() ===
              newContact.address.toLowerCase(),
          );
          expect(davidContact?.name).toBe(newContact.name);

          // Verify Bob (deleted)
          const bobContact = finalContacts.find(
            (contact: Contact) =>
              contact.address?.toLowerCase() ===
              MOCK_CONTACTS.BOB_SEPOLIA.a.toLowerCase(),
          );
          expect(bobContact).toBeUndefined();

          console.log('✅ All contacts verified on second device');
        },
      );
    });
  });
});
