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
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

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
          walletSrp = await getSRP(driver)
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

    it('syncs contacts with minimal data (no memo)', async function (this: any) {
      const { userStorageMockttpController } = await arrange();

      const minimalContact = {
        name: 'Minimal Contact',
        address: MOCK_CONTACT_ADDRESSES.DIANA,
        chainId: MOCK_CHAIN_IDS.SEPOLIA,
        memo: '', // Empty memo
      };

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

          // Add contact via UI like the working test
          const header = new HeaderNavbar(driver);
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();

          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();
          await contactsSettings.addContact(minimalContact.name, minimalContact.address);

          // Wait for contact to be synced
          await waitUntilSyncedContactsNumberEquals(1);

          console.log('Minimal contact data synced successfully');
        },
      );
    });

    it.only('handles contact addition on different networks separately', async function (this: any) {
      const { userStorageMockttpController } = await arrange();

      const mainnetContact = {
        name: 'Mainnet Contact',
        address: MOCK_CONTACT_ADDRESSES.ALICE,
        chainId: MOCK_CHAIN_IDS.MAINNET,
        memo: 'On Mainnet',
      };

      const sepoliaContact = {
        name: 'Sepolia Contact',
        address: MOCK_CONTACT_ADDRESSES.ALICE, // Same address, different chain
        chainId: MOCK_CHAIN_IDS.SEPOLIA,
        memo: 'On Sepolia',
      };

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

          // Add first contact via UI
          const header = new HeaderNavbar(driver);
          await header.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToContactsSettings();


          const contactsSettings = new ContactsSettings(driver);
          await contactsSettings.check_pageIsLoaded();

          await contactsSettings.addContact(mainnetContact.name, mainnetContact.address);

          await waitUntilSyncedContactsNumberEquals(1);

          // Add second contact via UI
          // @fabiobozzo - looks like the contact is getting overriden on the UI
          await contactsSettings.addContact(sepoliaContact.name, sepoliaContact.address, 'button');

          // Should have 2 separate contacts now
          await waitUntilSyncedContactsNumberEquals(2);

          console.log('Multiple contacts synced successfully');
        },
      );
    });
  });
});