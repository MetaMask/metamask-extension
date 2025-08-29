import { Mockttp } from 'mockttp';
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
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import { importWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';

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
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToPrivacySettings();

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.checkPageIsLoaded();
  await privacySettings.openChangePassword();

  const changePasswordPage = new ChangePasswordPage(driver);
  await changePasswordPage.checkPageIsLoaded();

  await changePasswordPage.confirmCurrentPassword(currentPassword);

  await changePasswordPage.changePassword(newPassword);
  if (isSocialLogin) {
    await changePasswordPage.checkPasswordChangedWarning();
    await changePasswordPage.confirmChangePasswordWarning();
  }

  await privacySettings.checkPasswordChangeSuccessToastIsDisplayed();

  await settingsPage.closeSettingsPage();

  // Wait for the password change to be applied to the social login user
  await driver.delay(2_000);

  await headerNavbar.lockMetaMask();
}

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

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        const isSocialImportFlow = true;
        await onboardingCompletePage.completeOnboarding(isSocialImportFlow);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await doPasswordChangeAndLockWallet(
          driver,
          WALLET_PASSWORD,
          'newPassword',
          true,
        );

        const loginPage = new LoginPage(driver);
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        await homePage.checkPageIsLoaded();
        await homePage.checkConnectionsRemovedModalIsDisplayed();
      },
    );
  });
});
