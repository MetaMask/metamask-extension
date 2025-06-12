import { Mockttp } from 'mockttp';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import { completeNewWalletFlowContactSyncing, completeOnboardFlowContactSyncing, getSRP } from '../flows';
import { arrangeContactSyncingTestUtils } from './helpers';
import { MOCK_CONTACT_ADDRESSES, MOCK_CHAIN_IDS } from './mock-data';
import { IDENTITY_TEAM_SEED_PHRASE } from '../constants';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import ContactsSettings from '../../../page-objects/pages/settings/contacts-settings';

describe('Contact syncing - Add Contact', function (this: any) {
  this.timeout(200000); // Increase timeout for flaky tests

  const arrange = async () => {
    const newContact = {
      name: 'Charlie New Contact',
      address: MOCK_CONTACT_ADDRESSES.CHARLIE,
      chainId: MOCK_CHAIN_IDS.MAINNET,
      memo: 'Newly added contact',
    };

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      newContact,
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function (this: any) {
    it('syncs newly added contacts and persists across devices', async function (this: any) {
      const {
        newContact,
        userStorageMockttpController,
      } = await arrange();

      let walletSrp: string;

      // First device: Create new wallet and add a contact
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

          const { waitUntilSyncedContactsNumberEquals } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Add contact via UI
          const header = new HeaderNavbar(driver);
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();
          await contactsSettings.addContact(newContact.name, newContact.address);

          // First verify the contact was added locally in the UI
          await contactsSettings.check_contactDisplayed({
            contactName: newContact.name,
            address: '0x34567...89012',
          });

          // Wait for contact to be synced
          await waitUntilSyncedContactsNumberEquals(1);

          console.log('Contact successfully added and synced on first device');

          // Store SRP for second device test
          walletSrp = await getSRP(driver);
        },
      );

      // Second device: Import same wallet and verify contact is synced
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
          await completeOnboardFlowContactSyncing(driver, walletSrp);

          const { waitUntilSyncedContactsNumberEquals } =
            arrangeContactSyncingTestUtils(driver, userStorageMockttpController);

          // Wait for contact to sync from server
          await waitUntilSyncedContactsNumberEquals(1);

          console.log('Contact successfully synced to second device');
        },
      );
    });
  });
});