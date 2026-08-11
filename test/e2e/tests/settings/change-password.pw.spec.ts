import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  completeCreateNewWalletOnboardingFlow,
  completeOnboardingWithPasskey,
  importWalletWithSocialLoginOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import {
  lockAndWaitForPasskeyUnlockPage,
  login,
} from '../../page-objects/flows/login.flow';
import {
  changePasswordAndLockWallet,
  closeSettings,
  navigateToSecurityAndPassword,
} from '../../page-objects/flows/settings.flow';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import {
  E2E_DRIVER,
  MOCK_GOOGLE_ACCOUNT,
  WALLET_PASSWORD,
} from '../../constants';
import { DUMMY_PASSKEY_RECORD } from '../../webdriver/virtual-authenticator';

pwTest.describe('Change wallet password', () => {
  const OLD_PASSWORD = WALLET_PASSWORD;
  const NEW_PASSWORD = 'newPassword';

  pwTest(
    'should change wallet password and able to unlock with new password',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
        },
        async ({ driver }) => {
          await completeCreateNewWalletOnboardingFlow({
            driver,
            skipSRPBackup: true,
            password: OLD_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();

          await changePasswordAndLockWallet(driver, OLD_PASSWORD, NEW_PASSWORD);

          const loginPage = new LoginPage(driver);

          // Try to login with old password, should show incorrect password message
          await loginPage.loginToHomepage(OLD_PASSWORD);
          await loginPage.checkIncorrectPasswordMessageIsDisplayed();

          // Login with new password, should login successfully
          await loginPage.loginToHomepage(NEW_PASSWORD);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'should change wallet password and able to unlock with new password for social login user',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          testSpecificMock: (server: Mockttp) => {
            // using this to mock the OAuth Service (Web Authentication flow + Auth server)
            const oAuthMockttpService = new OAuthMockttpService();
            return oAuthMockttpService.setup(server, {
              userEmail: MOCK_GOOGLE_ACCOUNT,
            });
          },
        },
        async ({ driver }) => {
          await importWalletWithSocialLoginOnboardingFlow({
            driver,
            password: OLD_PASSWORD,
          });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.waitForNonEvmAccountsLoaded();

          await changePasswordAndLockWallet(
            driver,
            OLD_PASSWORD,
            NEW_PASSWORD,
            true,
          );

          const loginPage = new LoginPage(driver);

          // Try to login with old password, should show incorrect password message
          await loginPage.loginToHomepage(OLD_PASSWORD);
          await loginPage.checkIncorrectPasswordMessageIsDisplayed();

          // Login with new password, should login successfully
          await loginPage.loginToHomepage(NEW_PASSWORD);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'Changes password with passkey fallback to password verification + turn off biometrics',
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

      const PASSKEY_NEW_PASSWORD = 'newSecurePassword123!';

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withPasskeyController({ passkeyRecord: DUMMY_PASSKEY_RECORD })
            .build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver }) => {
          await login(driver, { ignorePasskeyUnlock: true });

          await changePasswordAndLockWallet(
            driver,
            OLD_PASSWORD,
            PASSKEY_NEW_PASSWORD,
          );

          const loginPage = new LoginPage(driver);
          await loginPage.loginToHomepage(OLD_PASSWORD);
          await loginPage.checkIncorrectPasswordMessageIsDisplayed();

          await loginPage.loginToHomepage(PASSKEY_NEW_PASSWORD);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );

  pwTest(
    'Changes password with passkey verification (real enrollment) + keep biometrics on',
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

      const PASSKEY_NEW_PASSWORD = 'passkeyNewPassword456!';

      await withFixtures(
        {
          fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
          driverType: E2E_DRIVER.PLAYWRIGHT,
          title: testInfo.titlePath.join(' '),
          virtualAuthenticator: true,
        },
        async ({ driver }) => {
          await completeOnboardingWithPasskey({ driver });

          await navigateToSecurityAndPassword(driver);

          const privacySettings = new PrivacySettings(driver);
          await privacySettings.openChangePassword();

          const changePasswordPage = new ChangePasswordPage(driver);
          await changePasswordPage.waitForPasskeyVerificationToComplete();

          await changePasswordPage.changePassword(PASSKEY_NEW_PASSWORD);

          // Password change triggers an async vault re-encryption. No UI element
          // reliably signals completion, so a brief delay avoids navigating away
          // before the new password is persisted.
          await driver.delay(2_000);

          await closeSettings(driver);

          await lockAndWaitForPasskeyUnlockPage(driver);

          const loginPage = new LoginPage(driver);
          await loginPage.clickUsePassword();
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage(OLD_PASSWORD);
          await loginPage.checkIncorrectPasswordMessageIsDisplayed();

          await loginPage.loginToHomepage(PASSKEY_NEW_PASSWORD);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
        },
      );
    },
  );
});
