import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { Mockttp } from 'mockttp';
import { createNewWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';

async function doPasswordChangeAndLockWallet(driver: Driver, currentPassword: string, newPassword: string, isSocialLogin: boolean = false) {
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
    // Wait for the password change to be applied to the social login user
    await driver.delay(2_000);
  }

  await headerNavbar.lockMetaMask();
}

describe('Change wallet password', function () {
  const NEW_PASSWORD = 'newPassword';

  it('should change wallet password and able to unlock with new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await doPasswordChangeAndLockWallet(driver, WALLET_PASSWORD, NEW_PASSWORD);

        const loginPage = new LoginPage(driver);

        // Try to login with old password, should show incorrect password message
        await loginPage.loginToHomepage(WALLET_PASSWORD);
        await loginPage.check_incorrectPasswordMessageIsDisplayed();

        // Login with new password, should login successfully
        await loginPage.loginToHomepage(NEW_PASSWORD);
        const homePage = new HomePage(driver);
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
          return oAuthMockttpService.setup(server);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await createNewWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        await doPasswordChangeAndLockWallet(driver, WALLET_PASSWORD, NEW_PASSWORD, true);

        const loginPage = new LoginPage(driver);

        // // Try to login with old password, should show incorrect password message
        await loginPage.loginToHomepage(WALLET_PASSWORD);
        await loginPage.check_incorrectPasswordMessageIsDisplayed();

        // Login with new password, should login successfully
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.check_pageIsLoaded();
      },
    );
  });
});
