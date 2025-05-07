import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import {
  IDENTITY_TEAM_PASSWORD,
  IDENTITY_TEAM_SEED_PHRASE,
} from '../constants';
import { ACCOUNT_TYPE } from '../../../constants';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import {
  createNewWalletOnboardingFlow,
  importSRPOnboardingFlow,
} from '../../../page-objects/flows/onboarding.flow';
import PrivacySettings from '../../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import { completeOnboardFlowIdentity } from '../flows';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from './mock-data';

describe('Account syncing - Opt-out Backup and sync', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const arrange = async () => {
    const unencryptedAccounts = accountsToMockForAccountsSync;
    const mockedAccountSyncResponse = await getAccountsSyncMockResponse();
    const defaultAccountOneName = 'Account 1';

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      unencryptedAccounts,
      mockedAccountSyncResponse,
      userStorageMockttpController,
      defaultAccountOneName,
    };
  };

  describe('from inside MetaMask', function () {
    let walletSrp: string;

    it('does not sync when backup and sync is turned off - previously synced accounts', async function () {
      const {
        unencryptedAccounts,
        mockedAccountSyncResponse,
        userStorageMockttpController,
        defaultAccountOneName,
      } = await arrange();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            // Setting up this mock to ensure that no User Storage requests are made when Backup and sync is off.
            // If any requests are made, they will match this mock and cause the test to fail, indicating that accounts are being incorrectly synced.
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
              {
                getResponse: mockedAccountSyncResponse,
              },
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await importSRPOnboardingFlow({
            driver,
            seedPhrase: IDENTITY_TEAM_SEED_PHRASE,
            password: IDENTITY_TEAM_PASSWORD,
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
          await homePage.check_expectedBalanceIsDisplayed('0');

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            1,
            ACCOUNT_TYPE.Ethereum,
          );
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            defaultAccountOneName,
          );
        },
      );
    });

    it('does not sync when backup and sync is turned off - new user', async function () {
      const { userStorageMockttpController, defaultAccountOneName } =
        await arrange();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            // Setting up this mock to ensure that no User Storage requests are made when Backup and sync is off.
            // If any requests are made, they will match this mock and cause the test to fail, indicating that accounts are being incorrectly synced.
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await createNewWalletOnboardingFlow({
            driver,
            password: IDENTITY_TEAM_PASSWORD,
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
          await homePage.check_expectedBalanceIsDisplayed('0');

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
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
            accountName: 'New Account',
          });

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
          // Setting up this mock to ensure that no User Storage requests are made when Backup and sync is off.
          // If any requests are made, they will match this mock and cause the test to fail, indicating that accounts are being incorrectly synced.
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
        },
      );
    });
  });
});
