import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
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
  lockAndWaitForLoginPage,
  lockAndWaitForPasskeyUnlockPage,
  login,
} from '../../page-objects/flows/login.flow';
import { navigateToSecurityAndPassword } from '../../page-objects/flows/settings.flow';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import { DUMMY_PASSKEY_RECORD } from '../../webdriver/virtual-authenticator';

async function doPasswordChangeAndLockWallet(
  driver: Driver,
  currentPassword: string,
  newPassword: string,
  isSocialLogin: boolean = false,
) {
  await navigateToSecurityAndPassword(driver);

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.openChangePassword();

  const changePasswordPage = new ChangePasswordPage(driver);
  await changePasswordPage.checkPageIsLoaded();

  await changePasswordPage.confirmCurrentPassword(currentPassword);

  await changePasswordPage.changePassword(newPassword);
  if (isSocialLogin) {
    await changePasswordPage.checkPasswordChangedWarning();
    await changePasswordPage.confirmChangePasswordWarning();
  }

  // Password change triggers an async vault re-encryption. No UI element
  // reliably signals completion, so a brief delay avoids navigating away
  // before the new password is persisted.
  await driver.delay(2_000);

  const settingsPage = new SettingsPage(driver);
  await settingsPage.clickBackButton();

  await lockAndWaitForLoginPage(driver);
}

describe('Change wallet password', function () {
  const OLD_PASSWORD = WALLET_PASSWORD;
  const NEW_PASSWORD = 'newPassword';

  it('should change wallet password and able to unlock with new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          skipSRPBackup: true,
          password: OLD_PASSWORD,
        });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await doPasswordChangeAndLockWallet(driver, OLD_PASSWORD, NEW_PASSWORD);

        const loginPage = new LoginPage(driver);

        // Try to login with old password, should show incorrect password message
        await loginPage.loginToHomepage(OLD_PASSWORD);
        await loginPage.checkIncorrectPasswordMessageIsDisplayed();

        // Login with new password, should login successfully
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('should change wallet password and able to unlock with new password for social login user', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
          password: OLD_PASSWORD,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await doPasswordChangeAndLockWallet(
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
  });

  it('Changes password with passkey fallback to password verification + turn off biometrics', async function () {
    // Firefox does not support Selenium's Virtual Authenticator API
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }

    const PASSKEY_NEW_PASSWORD = 'newSecurePassword123!';

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPasskeyController({ passkeyRecord: DUMMY_PASSKEY_RECORD })
          .build(),
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { ignorePasskeyUnlock: true });

        await doPasswordChangeAndLockWallet(
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
  });

  it('Changes password with passkey verification (real enrollment) + keep biometrics on', async function () {
    // Firefox does not support Selenium's Virtual Authenticator API
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }

    const PASSKEY_NEW_PASSWORD = 'passkeyNewPassword456!';

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        virtualAuthenticator: true,
      },
      async ({ driver }: { driver: Driver }) => {
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

        const settingsPage = new SettingsPage(driver);
        await settingsPage.clickBackButton();

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
  });
});
