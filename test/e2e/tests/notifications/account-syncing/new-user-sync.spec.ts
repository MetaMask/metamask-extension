import { Mockttp } from 'mockttp';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockNotificationServices } from '../mocks';
import { NOTIFICATIONS_TEAM_PASSWORD } from '../constants';
import { UserStorageMockttpController } from '../../../helpers/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/homepage';
import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../../page-objects/flows/onboarding.flow';
import { getSRP, IS_ACCOUNT_SYNCING_ENABLED } from './helpers';

describe('Account syncing - New User @no-mmi', function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }

  describe('from inside MetaMask', function () {
    it('syncs after new wallet creation', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();
      let walletSrp: string;

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
          // Create a new wallet
          await completeCreateNewWalletOnboardingFlow(
            driver,
            NOTIFICATIONS_TEAM_PASSWORD,
          );
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          // Open account menu and validate 1 account is shown
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(1);
          await accountListPage.check_accountDisplayedInAccountList(
            'Account 1',
          );

          // Add a second account
          await accountListPage.openAccountOptionsMenu();
          await accountListPage.addNewAccountWithCustomLabel(
            'My Second Account',
          );

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
          // Onboard with import flow using SRP from new account created above
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: walletSrp,
            password: NOTIFICATIONS_TEAM_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

          // Open account menu and validate the 2 accounts have been retrieved
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();

          await accountListPage.check_numberOfAvailableAccounts(2);

          await accountListPage.check_accountDisplayedInAccountList(
            'Account 1',
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Second Account',
          );
        },
      );
    });
  });
});
