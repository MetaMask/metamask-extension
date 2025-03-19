import { Mockttp } from 'mockttp';
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

describe('Account syncing - Rename Accounts @no-mmi', function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }
  describe('from inside MetaMask', function () {
    it('syncs renamed account names', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath('accounts', server, {
              getResponse: accountsSyncMockResponse,
            });

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
          await accountListPage.check_numberOfAvailableAccounts(
            accountsSyncMockResponse.length,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Synced Account',
          );
          await accountListPage.openAccountOptionsMenu();
          await accountListPage.changeAccountLabel('My Renamed First Account');
        },
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath('accounts', server);
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
          await accountListPage.check_numberOfAvailableAccounts(
            accountsSyncMockResponse.length,
          );
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Renamed First Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Synced Account',
          );
        },
      );
    });
  });
});
