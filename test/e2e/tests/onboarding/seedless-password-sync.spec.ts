import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { importWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { navigateToSecurityAndPassword } from '../../page-objects/flows/settings.flow';
import ChangePasswordPage from '../../page-objects/pages/settings/change-password-page';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import { lockAndWaitForLoginPage } from '../../page-objects/flows/login.flow';
import { SeedlessGlobalPassword } from '../../helpers/seedless-onboarding/data';

const OLD_PASSWORD = WALLET_PASSWORD;
const NEW_PASSWORD = SeedlessGlobalPassword;

describe('Seedless Onboarding (Social Login) password sync and recovery', function () {
  it('should lock the wallet on password change failure and unlock with the old password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            failStoreKeyShareRequest: true,
          });
        },
        ignoredConsoleErrors: [
          'SeedlessOnboardingController - Failed to change password',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.delay(2_000);
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        await navigateToSecurityAndPassword(driver);

        const privacySettings = new PrivacySettings(driver);
        await privacySettings.openChangePassword();

        const changePasswordPage = new ChangePasswordPage(driver);
        await changePasswordPage.checkPageIsLoaded();

        await changePasswordPage.confirmCurrentPassword(OLD_PASSWORD);

        await changePasswordPage.changePassword(NEW_PASSWORD);

        await changePasswordPage.checkPasswordChangedWarning();
        await changePasswordPage.confirmChangePasswordWarning();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        await loginPage.loginToHomepage(OLD_PASSWORD);

        // after unlock, the password change page should be loaded again
        // as this is the last page that was loaded before the lock was applied
        await changePasswordPage.checkPageIsLoaded();
      },
    );
  });

  it('should sync the latest global password and unlock with the new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            simulatePasswordSync: true,
          });
        },
        ignoredConsoleErrors: [
          'SeedlessOnboardingController - Failed to change password',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.delay(2_000);
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        await lockAndWaitForLoginPage(driver);
        const loginPage = new LoginPage(driver);

        // The mock reports that another device updated the password.
        // Sync the latest global password to the local wallet.
        await loginPage.loginToHomepage(NEW_PASSWORD);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();
      },
    );
  });

  it('should recover the password change failure with, `LOCAL_PASSWORD_PENDING` and unlock the wallet',  async function() {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          await oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
        ignoredConsoleErrors: [
          'SeedlessOnboardingController - Failed to change password',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.delay(2_000);
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();

        await lockAndWaitForLoginPage(driver);
        const loginPage = new LoginPage(driver);

        await loginPage.loginToHomepage(WALLET_PASSWORD);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNonEvmAccountsLoaded();
      },
    );
  });
});
