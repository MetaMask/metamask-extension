import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockNotificationServices } from '../mocks';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from '../constants';
import { UserStorageMockttpController } from '../../../helpers/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/homepage';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import { accountsSyncMockResponse } from './mockData';
import { IS_ACCOUNT_SYNCING_ENABLED } from './helpers';

describe('Account syncing - Add Account @no-mmi', function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }
  describe('from inside MetaMask', function () {
    it('syncs newly added accounts - custom name', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
              {
                getResponse: accountsSyncMockResponse,
              },
            );

            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
        },
        async ({ driver }) => {
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
            password: NOTIFICATIONS_TEAM_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            accountsSyncMockResponse.length,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Synced Account',
          );
          await accountListPage.addNewAccount('My third account');
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
            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
        },
        async ({ driver }) => {
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
            password: NOTIFICATIONS_TEAM_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();

          const accountSyncResponse = userStorageMockttpController.paths.get(
            USER_STORAGE_FEATURE_NAMES.accounts,
          )?.response;

          await accountListPage.check_numberOfAvailableAccounts(
            accountSyncResponse?.length as number,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My third account',
          );
        },
      );
    });

    it('syncs newly added accounts - default name', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
              {
                getResponse: accountsSyncMockResponse,
              },
            );

            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
        },
        async ({ driver }) => {
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
            password: NOTIFICATIONS_TEAM_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            accountsSyncMockResponse.length,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Synced Account',
          );
          await accountListPage.addNewAccount();
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
            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
        },
        async ({ driver }) => {
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
            password: NOTIFICATIONS_TEAM_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();

          const accountSyncResponse = userStorageMockttpController.paths.get(
            USER_STORAGE_FEATURE_NAMES.accounts,
          )?.response;

          await accountListPage.check_numberOfAvailableAccounts(
            accountSyncResponse?.length as number,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'Account 3',
          );
        },
      );
    });
  });
});
