import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { veryLargeDelayMs, withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { ACCOUNT_TYPE } from '../../../constants';
import { mockIdentityServices } from '../mocks';
import { IDENTITY_TEAM_PASSWORD } from '../constants';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import PrivacySettings from '../../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import {
  completeNewWalletFlowIdentity,
  completeOnboardFlowIdentity,
} from '../flows';
import { arrangeTestUtils } from './helpers';

describe('Account syncing - New User', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  describe('from inside MetaMask', function () {
    it('syncs after new wallet creation', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();
      let walletSrp: string;

      const defaultAccountOneName = 'Account 1';
      const secondAccountName = 'My Second Account';

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );

            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await completeNewWalletFlowIdentity(driver);
          const homePage = new HomePage(driver);
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          // Open account menu and validate 1 account is shown
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            1,
            ACCOUNT_TYPE.Ethereum,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            defaultAccountOneName,
          );

          // Wait for the message signing snap to list entropy sources
          // And for internal accounts to be updated with entropySourceIds and derivationPaths
          await driver.delay(veryLargeDelayMs);

          // Add a second account
          const {
            waitUntilSyncedAccountsNumberEquals,
            prepareEventsEmittedCounter,
          } = arrangeTestUtils(driver, userStorageMockttpController);

          const { waitUntilEventsEmittedNumberEquals } =
            prepareEventsEmittedCounter(
              UserStorageMockttpControllerEvents.PUT_SINGLE,
            );

          await accountListPage.openAccountOptionsMenu();
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
            accountName: secondAccountName,
          });
          // Wait for the account AND account name to be synced
          await waitUntilSyncedAccountsNumberEquals(2);
          await waitUntilEventsEmittedNumberEquals(1);

          // Set SRP to use for retreival
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.check_pageIsLoaded();
          await headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.check_pageIsLoaded();
          await settingsPage.goToPrivacySettings();

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.check_pageIsLoaded();
          await privacySettings.openRevealSrpQuiz();
          await privacySettings.completeRevealSrpQuiz();
          await privacySettings.fillPasswordToRevealSrp(IDENTITY_TEAM_PASSWORD);
          walletSrp = await privacySettings.getSrpInRevealSrpDialog();
          if (!walletSrp) {
            throw new Error('Wallet SRP was not set');
          }
        },
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          // Onboard with import flow using SRP from new account created above
          await completeOnboardFlowIdentity(driver, walletSrp);

          // Open account menu and validate the 2 accounts have been retrieved
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();

          await accountListPage.check_numberOfAvailableAccounts(
            2,
            ACCOUNT_TYPE.Ethereum,
          );

          await accountListPage.check_accountDisplayedInAccountList(
            defaultAccountOneName,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            secondAccountName,
          );
        },
      );
    });
  });
});
