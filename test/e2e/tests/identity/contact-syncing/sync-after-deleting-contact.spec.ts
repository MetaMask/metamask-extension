import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeNewWalletFlowContactSyncing } from '../flows';
import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACTS } from './mock-data';
import { expect } from '@playwright/test';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';

describe('Contact syncing - Delete Contact', function (this: any) {
  this.timeout(200000); // Increase timeout for flaky tests

  const arrange = async () => {
    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('syncs contact deletion to cloud', async function (this: any) {
      const { userStorageMockttpController } = await arrange();

      const contactToDelete = MOCK_CONTACTS.ALICE_MAINNET;

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
          await completeNewWalletFlowContactSyncing(driver);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Add contact via UI (this works and syncs to cloud)
          const header = new HeaderNavbar(driver);
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();

          // Add the contact
          await contactsSettings.addContact(contactToDelete.n, contactToDelete.a);

          // Wait for contact to sync to cloud
          await waitUntilSyncedContactsNumberEquals(1);

          // Verify contact was added
          let contacts = await getCurrentContacts();
          expect(contacts.length).toBe(1);

          // When adding contacts via UI in test environment, they get the test network chainId (0x539)
          const expectedChainId = '0x539'; // Test network chainId in hex

          // Verify the contact exists before deletion
          const contactBeforeDeletion = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === contactToDelete.a.toLowerCase() &&
            contact.chainId === expectedChainId
          );
          expect(contactBeforeDeletion).toBeDefined();
          expect((contactBeforeDeletion as any).name).toBe(contactToDelete.n);

          // Navigate back to contacts settings to delete the contact
          await header.openSettingsPage();
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();
          await contactsSettings.check_pageIsLoaded();

          // Delete the contact via UI
          await contactsSettings.deleteContact(contactToDelete.n);

          // Wait for contact to be deleted and synced
          await waitUntilSyncedContactsNumberEquals(0);

          // Verify contact was deleted and synced
          contacts = await getCurrentContacts();
          expect(contacts.length).toBe(0);

          console.log('Contact deleted and synced successfully');
        },
      );
    });

    it('syncs deletion of single contact', async function (this: any) {
      const { userStorageMockttpController } = await arrange();

      const singleContact = MOCK_CONTACTS.BOB_SEPOLIA;

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
          await completeNewWalletFlowContactSyncing(driver);

          const { waitUntilSyncedContactsNumberEquals, getCurrentContacts } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Add single contact via UI
          const header = new HeaderNavbar(driver);
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();
          await contactsSettings.addContact(singleContact.n, singleContact.a);

          // Wait for contact to sync
          await waitUntilSyncedContactsNumberEquals(1);

          // Verify contact was added
          let contacts = await getCurrentContacts();
          expect(contacts.length).toBe(1);

          const expectedChainId = '0x539'; // Test network chainId in hex
          const addedContact = contacts[0];
          expect((addedContact as any).name).toBe(singleContact.n);
          expect((addedContact as any).address?.toLowerCase()).toBe(singleContact.a.toLowerCase());
          expect((addedContact as any).chainId).toBe(expectedChainId);

          // Navigate back to contacts settings to delete the contact
          await header.openSettingsPage();
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();
          await contactsSettings.check_pageIsLoaded();

          // Delete the contact via UI
          await contactsSettings.deleteContact(singleContact.n);

          // Wait for contact to be deleted and synced
          await waitUntilSyncedContactsNumberEquals(0);

          // Verify contact was deleted
          contacts = await getCurrentContacts();
          expect(contacts.length).toBe(0);

          console.log('Single contact deletion synced successfully');
        },
      );
    });
  });
});