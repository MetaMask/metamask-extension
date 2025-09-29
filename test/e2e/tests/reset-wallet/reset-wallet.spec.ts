import { Mockttp } from 'mockttp';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import { importWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';

describe('Reset Wallet - ', function () {
  it('should be able to reset wallet when encounters un-recoverable error in social login unlock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            throwAuthenticationErrorAtUnlock: true, // <=== This is intentional error to test the reset wallet flow
            passwordOutdated: true,
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.delay(10_000);
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        const isSocialImportFlow = true;
        await onboardingCompletePage.completeOnboarding(isSocialImportFlow);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);

        await headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);

        // login should fail due to Authentication Error
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        // reset the wallet
        await loginPage.resetWallet();

        await driver.delay(5_000);

        // should be on the welcome page after resetting the wallet
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // import wallet with social login and start a new session
        await startOnboardingPage.importWalletWithSocialLogin(
          AuthConnection.Google,
        );

        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        await onboardingCompletePage.completeOnboarding(isSocialImportFlow);
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
