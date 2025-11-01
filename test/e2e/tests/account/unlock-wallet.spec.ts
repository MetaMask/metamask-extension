import { Mockttp } from 'mockttp';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import { Browser } from 'selenium-webdriver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import {
  importWalletWithSocialLoginOnboardingFlow,
  onboardingMetricsFlow,
} from '../../page-objects/flows/onboarding.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';

describe('Unlock wallet - ', function () {
  it('handle incorrect password during unlock and login successfully', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[] | Ganache[] | undefined[];
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        // Lock Wallet
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.lockMetaMask();
        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage('123456');
        await loginPage.checkIncorrectPasswordMessageIsDisplayed();
        await loginPage.loginToHomepage();
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('should show connections removed modal when max key chain length is reached for social account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution', // issue #37342
        ],
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            passwordOutdated: true,
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.openChangePassword();

        const changePasswordPage = new ChangePasswordPage(driver);
        await changePasswordPage.checkPageIsLoaded();

        await changePasswordPage.confirmCurrentPassword(WALLET_PASSWORD);

        await changePasswordPage.changePassword('newPassword');
        await changePasswordPage.checkPasswordChangedWarning();
        await changePasswordPage.confirmChangePasswordWarning();

        await privacySettings.checkPasswordChangeSuccessToastIsDisplayed();

        await settingsPage.closeSettingsPage();

        // Wait for the password change to be applied to the social login user
        await driver.delay(2_000);

        await headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        // user should see the connections removed modal and reset the wallet
        await loginPage.resetWalletFromConnectionsRemovedModal();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          // In Firefox, we need to go to the metametrics page first
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: true,
            dataCollectionForMarketing: true,
          });
        }

        // should be on the welcome page after resetting the wallet
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // import wallet with social login and start a new session
        await startOnboardingPage.importWalletWithSocialLogin(
          AuthConnection.Google,
        );

        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage(WALLET_PASSWORD);
        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });
});
