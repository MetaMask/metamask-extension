import { Mockttp } from 'mockttp';
import {
  withFixtures,
  defaultGanacheOptions,
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
  onboardingCompleteWalletCreationWithOptOut,
  completeCreateNewWalletOnboardingFlowWithOptOut,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockNotificationServices } from '../mocks';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from '../constants';
import { UserStorageMockttpController } from '../../../helpers/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { accountsSyncMockResponse } from './mockData';
import { getSRP, IS_ACCOUNT_SYNCING_ENABLED } from './helpers';

describe('Account syncing - Opt-out Profile Sync @no-mmi', function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }
  describe('from inside MetaMask', function () {
    let walletSrp: string;
    it('does not sync when profile sync is turned off - previously synced account', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            // Mocks are still set up to ensure that requests are not matched
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
          await driver.navigate();
          await importSRPOnboardingFlow(
            driver,
            NOTIFICATIONS_TEAM_SEED_PHRASE,
            NOTIFICATIONS_TEAM_PASSWORD,
          );

          await onboardingCompleteWalletCreationWithOptOut(driver, {
            isNewWallet: false,
            basicFunctionality: false,
            profileSync: true,
            assets: false,
          });

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(1);
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            'My First Synced Account',
          );
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            'My Second Synced Account',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'Account 1',
          );
        },
      );
    });

    it('does not sync when profile sync is turned off - new user', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            // Mocks are still set up to ensure that requests are not matched
            userStorageMockttpController.setupPath('accounts', server);
            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
        },
        async ({ driver }) => {
          await driver.navigate();
          await completeCreateNewWalletOnboardingFlowWithOptOut(
            driver,
            NOTIFICATIONS_TEAM_PASSWORD,
            {
              isNewWallet: true,
              basicFunctionality: false,
              profileSync: true,
              assets: false,
            },
          );

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(1);
          await accountListPage.check_accountDisplayedInAccountList(
            'Account 1',
          );
          await accountListPage.addNewAccountWithCustomLabel('New Account');

          // Set SRP to use for retreival
          walletSrp = await getSRP(driver, NOTIFICATIONS_TEAM_PASSWORD);
          if (!walletSrp) {
            throw new Error('Wallet SRP was not set');
          }
        },
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            // Mocks are still set up to ensure that requests are not matched
            userStorageMockttpController.setupPath('accounts', server);
            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
        },
        async ({ driver }) => {
          await driver.navigate();
          await completeImportSRPOnboardingFlow(
            driver,
            walletSrp,
            NOTIFICATIONS_TEAM_PASSWORD,
          );

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(1);
          await accountListPage.check_accountDisplayedInAccountList(
            'Account 1',
          );
        },
      );
    });
  });
});
