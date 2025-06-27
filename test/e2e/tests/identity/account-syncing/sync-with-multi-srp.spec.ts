import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import {
  regularDelayMs,
  veryLargeDelayMs,
  withFixtures,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { ACCOUNT_TYPE } from '../../../constants';
import { mockIdentityServices } from '../mocks';
import { IDENTITY_TEAM_SEED_PHRASE_2 } from '../constants';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { completeOnboardFlowIdentity } from '../flows';
import { arrangeTestUtils } from './helpers';

describe('Account syncing - Multi SRP', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  describe('from inside MetaMask', function () {
    it('syncs after adding a second SRP', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      const defaultAccountOneName = 'Account 1';
      const secondAccountName = 'My Second Account';
      const defaultAccountOneNameSrp2 = 'Account 3';
      const thirdAccountNameSrp2 = 'My Fourth Account';

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
          await completeOnboardFlowIdentity(driver);
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
          await driver.delay(regularDelayMs);

          // Add a new SRP and add a new account on top of the one created by default when
          // importing a new SRP
          await header.openAccountMenu();
          await accountListPage.startImportSecretPhrase(
            IDENTITY_TEAM_SEED_PHRASE_2,
          );
          await homePage.check_newSrpAddedToastIsDisplayed();

          await waitUntilSyncedAccountsNumberEquals(3);

          await header.openAccountMenu();
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
            accountName: thirdAccountNameSrp2,
            srpIndex: 2,
          });
          await driver.delay(regularDelayMs);

          // Wait for the account AND account name to be synced
          await waitUntilSyncedAccountsNumberEquals(4);
          await waitUntilEventsEmittedNumberEquals(3);
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
          await completeOnboardFlowIdentity(driver);
          const homePage = new HomePage(driver);
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          // Open account menu and validate the 4 accounts have been retrieved
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.startImportSecretPhrase(
            IDENTITY_TEAM_SEED_PHRASE_2,
          );
          await homePage.check_newSrpAddedToastIsDisplayed();

          await driver.delay(veryLargeDelayMs);

          await header.openAccountMenu();
          await accountListPage.check_pageIsLoaded();

          await accountListPage.check_numberOfAvailableAccounts(
            4,
            ACCOUNT_TYPE.Ethereum,
          );

          await accountListPage.check_accountDisplayedInAccountList(
            defaultAccountOneName,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            secondAccountName,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            thirdAccountNameSrp2,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            defaultAccountOneNameSrp2,
          );
        },
      );
    });
  });
});
