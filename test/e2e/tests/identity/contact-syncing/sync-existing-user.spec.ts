import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { IDENTITY_TEAM_SEED_PHRASE, IDENTITY_TEAM_STORAGE_KEY } from '../constants';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeOnboardFlowContactSyncing, getSRP } from '../flows';
import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACTS, createContactKey } from './mock-data';
import { createEncryptedResponse } from '../../../helpers/identity/user-storage/generateEncryptedData';
import { expect } from '@playwright/test';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';

describe('Contact Syncing - Existing User', function (this: any) {
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

    // Contact to be deleted (Bob)
    const contactToDelete = MOCK_CONTACTS.BOB_SEPOLIA;

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
      initialRemoteContacts.map(contact =>
        createEncryptedResponse({
          data: contact,
          storageKey: IDENTITY_TEAM_STORAGE_KEY,
          path: `${USER_STORAGE_FEATURE_NAMES.addressBook}.${createContactKey(contact)}`,
        })
      )
    );

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      initialRemoteContacts,
      newContact,
      modifiedContactName,
      contactToDelete,
      expectedFinalContacts,
      mockedContactSyncResponse,
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('performs complete lifecycle: remote→local contact sync, add, modify, delete, verify sync on other device', async function (this: any) {
      const {
        initialRemoteContacts,
        newContact,
        modifiedContactName,
        contactToDelete,
        expectedFinalContacts,
        mockedContactSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      let walletSrp: string;

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
          await completeOnboardFlowContactSyncing(
            driver,
            IDENTITY_TEAM_SEED_PHRASE,
          );

          const {
            waitUntilSyncedContactsNumberEquals,
            waitUntilContactSyncingCompleted,
            getCurrentContacts
          } = arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // STEP 1: Verify initial remote contacts are synced to local
          console.log('STEP 1: Waiting for initial remote contacts to sync...');
          await waitUntilSyncedContactsNumberEquals(initialRemoteContacts.length);

          // Wait for contact syncing to complete (semaphore to be released)
          await waitUntilContactSyncingCompleted();
          console.log('✅ Contact syncing semaphore released');

          let contacts = await getCurrentContacts();
          expect(contacts.length).toBe(initialRemoteContacts.length);
          console.log('✅ Initial remote contacts synced successfully:', contacts.length);

          // Verify specific initial contacts
          const contactNames = contacts.map((contact: any) => contact.name);
          expect(contactNames).toContain('Alice Smith');
          expect(contactNames).toContain('Bob Johnson');
          expect(contactNames).toContain('Charlie Brown');

          // Set up UI navigation
          const header = new HeaderNavbar(driver);
          const settingsPage = new SettingsPage(driver);
          const contactsSettings = new ContactsSettings(driver);

          // STEP 2: Add new contact
          console.log('STEP 2: Adding new contact...');
          await header.openSettingsPage();
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();
          await contactsSettings.check_pageIsLoaded();
          await contactsSettings.addContact(newContact.name, newContact.address, 'button');

          // Debug: Check if contact syncing is still enabled and not in progress
          const debugState = await driver.executeScript(() =>
            (window as any).stateHooks?.getCleanAppState?.()
          );
          console.log('Debug state after adding David:', {
            isContactSyncingEnabled: debugState.metamask.isContactSyncingEnabled,
            isContactSyncingInProgress: debugState.metamask.isContactSyncingInProgress,
            isBackupAndSyncEnabled: debugState.metamask.isBackupAndSyncEnabled,
          });

          // Debug: Check if David was actually added to the address book
          const contactsAfterAdd = await getCurrentContacts();
          console.log('Contacts after adding David:', contactsAfterAdd.map((c: any) => ({
            name: c.name,
            address: c.address,
            chainId: c.chainId,
          })));

          // Wait for new contact to sync
          console.log('Waiting for David to sync to remote storage...');
          await waitUntilSyncedContactsNumberEquals(initialRemoteContacts.length + 1);

          console.log('✅ New contact added and synced');

          // STEP 3: Modify existing contact (Alice)
          console.log('STEP 3: Modifying existing contact...');

          // Navigate back to contacts list first
          await header.openSettingsPage();
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();
          await contactsSettings.check_pageIsLoaded();

          await contactsSettings.editContact({
            existingContactName: 'Alice Smith',
            newContactName: modifiedContactName,
            newContactAddress: MOCK_CONTACTS.ALICE_MAINNET.a,
          });

          // Wait for modification to sync
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            return updatedContacts.some((contact: any) => contact.name === modifiedContactName);
          }, 15000);
          console.log('✅ Contact modification synced');

          // STEP 4: Delete existing contact (Bob)
          console.log('STEP 4: Deleting existing contact...');
          await header.openSettingsPage();
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();
          await contactsSettings.check_pageIsLoaded();

          await contactsSettings.deleteContact('Bob Johnson');

          // Wait for deletion to sync
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            return !updatedContacts.some((contact: any) => contact.name === 'Bob Johnson');
          }, 15000);
          console.log('✅ Contact deletion synced');

          console.log('PHASE 1 complete - proceeding to second device test');

          // Store SRP for second device test
          walletSrp = await getSRP(driver);
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
          console.log('PHASE 2: Verifying final state on second device...');

          // Import same wallet on second device
          await completeOnboardFlowContactSyncing(driver, walletSrp);

          const { waitUntilSyncedContactsNumberEquals, waitUntilContactSyncingCompleted, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for all final contacts to sync
          await waitUntilSyncedContactsNumberEquals(expectedFinalContacts.length);

          // Verify final state matches expectations
          const finalContacts = await getCurrentContacts();
          expect(finalContacts.length).toBe(expectedFinalContacts.length);

          console.log('Final contacts on second device:', finalContacts.map((c: any) => ({
            name: c.name,
            address: c.address,
            chainId: c.chainId,
          })));

          // Verify specific contacts:
          // 1. Alice should be modified
          const aliceContact = finalContacts.find((contact: any) =>
            contact.address?.toLowerCase() === MOCK_CONTACTS.ALICE_MAINNET.a.toLowerCase()
          );
          expect((aliceContact as any)?.name).toBe(modifiedContactName);
          console.log('✅ Alice modification verified on second device');

          // 2. Charlie should be unchanged
          const charlieContact = finalContacts.find((contact: any) =>
            contact.address?.toLowerCase() === MOCK_CONTACTS.CHARLIE_POLYGON.a.toLowerCase()
          );
          expect((charlieContact as any)?.name).toBe('Charlie Brown');
          console.log('✅ Charlie unchanged verified on second device');

          // 3. David should be newly added
          const davidContact = finalContacts.find((contact: any) =>
            contact.address?.toLowerCase() === newContact.address.toLowerCase()
          );
          expect((davidContact as any)?.name).toBe(newContact.name);
          console.log('✅ David addition verified on second device');

          // 4. Bob should be deleted (not present)
          const bobContact = finalContacts.find((contact: any) =>
            contact.address?.toLowerCase() === MOCK_CONTACTS.BOB_SEPOLIA.a.toLowerCase()
          );
          expect(bobContact).toBeUndefined();
          console.log('✅ Bob deletion verified on second device');

          console.log('🎉 COMPREHENSIVE CONTACT SYNCING TEST PASSED!');
        },
      );
    });
  });
});