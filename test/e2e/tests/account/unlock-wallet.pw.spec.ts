import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import {
  lockAndWaitForLoginPage,
  lockAndWaitForPasskeyUnlockPage,
  login,
} from '../../page-objects/flows/login.flow';
import { closeSettings } from '../../page-objects/flows/settings.flow';
import {
  E2E_DRIVER,
  MOCK_GOOGLE_ACCOUNT,
  WALLET_PASSWORD,
} from '../../constants';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import {
  completeOnboardingWithPasskey,
  importWalletWithSocialLoginOnboardingFlow,
  onboardingMetricsFlow,
} from '../../page-objects/flows/onboarding.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';

pwTest.describe('Unlock wallet - ', () => {
  pwTest(
    'handle incorrect password during unlock and login successfully',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver, localNodes }) => {
          await login(driver, { localNode: localNodes[0] });
          // Lock Wallet
          await lockAndWaitForLoginPage(driver);
          const homePage = new HomePage(driver);
          const loginPage = new LoginPage(driver);
          await loginPage.loginToHomepage('123456');
          await loginPage.checkIncorrectPasswordMessageIsDisplayed();
          await loginPage.loginToHomepage();
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should show connections removed modal when max key chain length is reached for social account',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const isFirefox = testInfo.project.name === 'firefox-e2e';
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          testSpecificMock: (server: Mockttp) => {
            // using this to mock the OAuth Service (Web Authentication flow + Auth server)
            const oAuthMockttpService = new OAuthMockttpService();
            return oAuthMockttpService.setup(server, {
              passwordOutdated: true,
              userEmail: MOCK_GOOGLE_ACCOUNT,
            });
          },
        },
        async ({ driver }) => {
          await importWalletWithSocialLoginOnboardingFlow({
            driver,
          });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToSecurityAndPasswordSettings();

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.checkSecurityAndPasswordPageIsLoaded();
          await privacySettings.openChangePassword();

          const changePasswordPage = new ChangePasswordPage(driver);
          await changePasswordPage.checkPageIsLoaded();

          await changePasswordPage.confirmCurrentPassword(WALLET_PASSWORD);

          await changePasswordPage.changePassword('newPassword');
          await changePasswordPage.checkPasswordChangedWarning();
          await changePasswordPage.confirmChangePasswordWarning();

          // Wait for the password change to be applied to the social login user
          await driver.delay(2_000);

          await closeSettings(driver);

          await lockAndWaitForLoginPage(driver);
          const loginPage = new LoginPage(driver);
          await loginPage.loginToHomepage(WALLET_PASSWORD);
          await loginPage.checkConnectionsRemovedModalIsDisplayed();
          // reset wallet from connections removed modal
          await loginPage.resetWalletFromConnectionsRemovedModal();

          if (isFirefox) {
            await onboardingMetricsFlow(driver, {
              consentDecisionMade: true,
              optedIn: false,
              dataCollectionForMarketing: false,
            });
          }

          // check onboarding welcome page is loaded after resetting the wallet
          const startOnboardingPage = new StartOnboardingPage(driver);
          await startOnboardingPage.checkLoginPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'Unlocks wallet with passkey after onboarding',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      // The virtual authenticator (CDP WebAuthn domain) is Chromium-only
      pwTest.skip(
        testInfo.project.name === 'firefox-e2e',
        'Virtual authenticator is not supported on Firefox',
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver }) => {
          await completeOnboardingWithPasskey({ driver });

          // Check unlock with passkey at first visit
          await lockAndWaitForPasskeyUnlockPage(driver);

          const loginPage = new LoginPage(driver);
          await loginPage.clickPasskeyUnlock();

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();

          // Check unlock with passkey by passkey icon at password textbox
          await lockAndWaitForPasskeyUnlockPage(driver);
          await loginPage.clickUsePassword();
          await loginPage.checkPageIsLoaded();

          // React re-renders the unlock page asynchronously when switching between
          // passkey and password modes. No DOM condition reliably signals the
          // transition is complete, so a brief delay prevents a race where
          // clickUnlockWithPasskey acts on a stale/transitioning DOM.
          await driver.delay(2_000);
          await loginPage.clickUnlockWithPasskey();
          await homePage.checkPageIsLoaded();

          // Check unlock with password by password textbox
          await lockAndWaitForPasskeyUnlockPage(driver);
          await loginPage.clickUsePassword();
          await loginPage.checkPageIsLoaded();

          await loginPage.loginToHomepage(WALLET_PASSWORD);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );
});
