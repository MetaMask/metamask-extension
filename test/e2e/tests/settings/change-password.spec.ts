import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  completeCreateNewWalletOnboardingFlow,
  importWalletWithSocialLoginOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';

async function doPasswordChangeAndLockWallet(
  driver: Driver,
  currentPassword: string,
  newPassword: string,
  isSocialLogin: boolean = false,
) {
  // navigate to security & privacy settings
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.check_pageIsLoaded();
  await settingsPage.goToPrivacySettings();

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.check_pageIsLoaded();
  await privacySettings.openChangePassword();

  const changePasswordPage = new ChangePasswordPage(driver);
  await changePasswordPage.check_pageIsLoaded();

  await changePasswordPage.confirmCurrentPassword(currentPassword);

  await changePasswordPage.changePassword(newPassword);
  if (isSocialLogin) {
    await changePasswordPage.check_passwordChangedWarning();
    await changePasswordPage.confirmChangePasswordWarning();
  }

  await privacySettings.check_passwordChangeSuccessToastIsDisplayed();

  await settingsPage.closeSettingsPage();

  // Wait for the password change to be applied
  await driver.delay(2_000);

  await headerNavbar.lockMetaMask();
}

describe('Change wallet password', function () {
  const OLD_PASSWORD = WALLET_PASSWORD;
  const NEW_PASSWORD = 'newPassword';

  it('should change wallet password and able to unlock with new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          skipSRPBackup: true,
          password: OLD_PASSWORD,
        });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await doPasswordChangeAndLockWallet(driver, OLD_PASSWORD, NEW_PASSWORD);

        const loginPage = new LoginPage(driver);

        // Try to login with old password, should show incorrect password message
        await loginPage.loginToHomepage(OLD_PASSWORD);
        await loginPage.check_incorrectPasswordMessageIsDisplayed();

        // Login with new password, should login successfully
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.check_pageIsLoaded();
      },
    );
  });

  it('should change wallet password and able to unlock with new password for social login user', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
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

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        const isSocialImportFlow = true;
        await onboardingCompletePage.completeOnboarding(isSocialImportFlow);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await doPasswordChangeAndLockWallet(
          driver,
          OLD_PASSWORD,
          NEW_PASSWORD,
          true,
        );

        const loginPage = new LoginPage(driver);

        // // Try to login with old password, should show incorrect password message
        await loginPage.loginToHomepage(OLD_PASSWORD);
        await loginPage.check_incorrectPasswordMessageIsDisplayed();

        // Login with new password, should login successfully
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.check_pageIsLoaded();
      },
    );
  });
});
