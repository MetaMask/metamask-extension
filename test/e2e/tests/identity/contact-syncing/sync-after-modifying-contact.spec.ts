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

describe('Contact syncing - Modify Contact', function (this: any) {
  this.timeout(200000); // Increase timeout for flaky tests

  const arrange = async () => {
    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('syncs contact name changes across devices', async function (this: any) {
      const { userStorageMockttpController } = await arrange();

      const originalContact = MOCK_CONTACTS.ALICE_MAINNET;
      const newContactName = 'Alice Smith Updated';

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

          // Add a contact via UI (this works and syncs to cloud)
          const header = new HeaderNavbar(driver);
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();
          await contactsSettings.addContact(originalContact.n, originalContact.a);

          // Wait for the contact to sync to cloud
          await waitUntilSyncedContactsNumberEquals(1);

          // Verify contact was added
          let contacts = await getCurrentContacts();
          console.log('All contacts after adding:', JSON.stringify(contacts, null, 2));

          // When adding contacts via UI in test environment, they get the test network chainId (0x539)
          const expectedChainId = '0x539'; // Test network chainId in hex

          let addedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
            contact.chainId === expectedChainId
          );

          expect(addedContact).toBeDefined();
          expect((addedContact as any).name).toBe(originalContact.n);

          // Modify contact name via UI
          await contactsSettings.editContact({
            existingContactName: originalContact.n,
            newContactName: newContactName,
            newContactAddress: originalContact.a,
          });

          // Wait for the modification to sync to cloud
          await driver.wait(async () => {
            const updatedContacts = await getCurrentContacts();
            const updatedContact = updatedContacts.find((contact: any) =>
              contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
              contact.chainId === expectedChainId
            );
            return updatedContact && (updatedContact as any).name === newContactName;
          }, 15000);

          // Verify contact name was updated and synced
          contacts = await getCurrentContacts();
          const modifiedContact = contacts.find((contact: any) =>
            contact.address?.toLowerCase() === originalContact.a.toLowerCase() &&
            contact.chainId === expectedChainId
          );
          expect((modifiedContact as any).name).toBe(newContactName);

          console.log('Contact name modification synced successfully');
        },
      );
    });
  });
});