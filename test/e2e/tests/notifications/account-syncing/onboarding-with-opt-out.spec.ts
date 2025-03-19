import { Mockttp } from 'mockttp';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockNotificationServices } from '../mocks';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from '../constants';
import { UserStorageMockttpController } from '../../../helpers/user-storage/userStorageMockttpController';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import {
  createNewWalletOnboardingFlow,
  importSRPOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../../page-objects/flows/onboarding.flow';
import { getSRP, IS_ACCOUNT_SYNCING_ENABLED } from './helpers';
import { accountsSyncMockResponse } from './mockData';

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
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: NOTIFICATIONS_TEAM_SEED_PHRASE,
            password: NOTIFICATIONS_TEAM_PASSWORD,
          });
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const onboardingPrivacySettingsPage =
            new OnboardingPrivacySettingsPage(driver);
          await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
          await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();
          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.completeOnboarding();

          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

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
          await createNewWalletOnboardingFlow(
            driver,
            NOTIFICATIONS_TEAM_PASSWORD,
          );
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.navigateToDefaultPrivacySettings();

          const onboardingPrivacySettingsPage =
            new OnboardingPrivacySettingsPage(driver);
          await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
          await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();
          await onboardingCompletePage.check_pageIsLoaded();
          await onboardingCompletePage.completeOnboarding();

          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed();

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
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: walletSrp,
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
          await accountListPage.check_numberOfAvailableAccounts(1);
          await accountListPage.check_accountDisplayedInAccountList(
            'Account 1',
          );
        },
      );
    });
  });
});
