import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import { MOCK_GOOGLE_ACCOUNT, WALLET_PASSWORD } from '../../constants';
import {
  completeImportSRPOnboardingFlow,
  importWalletWithSocialLoginOnboardingFlow,
  onboardingMetricsFlow,
  handleSidepanelPostOnboarding,
} from '../../page-objects/flows/onboarding.flow';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';

describe('Reset Wallet - ', function () {
  it('creates a new wallet with SRP and completes the onboarding process after resetting the wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            userEmail: MOCK_GOOGLE_ACCOUNT,
            throwAuthenticationErrorAtUnlock: true, // <=== This is intentional error to test the reset wallet flow
            passwordOutdated: true,
          });
        },
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution', // issue #37342
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);

        await headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);

        // login should fail due to Authentication Error
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        // reset the wallet
        await loginPage.checkConnectionsRemovedModalIsDisplayed();
        // reset wallet from connections removed modal
        await loginPage.resetWalletFromConnectionsRemovedModal();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          // In Firefox, we need to go to the metametrics page first
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: true,
            dataCollectionForMarketing: false,
          });
        }

        // should be on the welcome page after resetting the wallet
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // import wallet with social login and start a new session
        await startOnboardingPage.createWalletWithSrp();

        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();

        await secureWalletPage.skipSRPBackup();

        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: true,
            dataCollectionForMarketing: false,
          });
        }

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });

  it('imports an SRP and completes the onboarding process after resetting the wallet', async function () {
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
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution', // issue #37342
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await importWalletWithSocialLoginOnboardingFlow({
          driver,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);

        await headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);

        // login should fail due to Authentication Error
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        // reset the wallet
        await loginPage.checkConnectionsRemovedModalIsDisplayed();
        // reset wallet from connections removed modal
        await loginPage.resetWalletFromConnectionsRemovedModal();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          // In Firefox, we need to go to the metametrics page first
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: true,
            dataCollectionForMarketing: false,
          });
        }

        await completeImportSRPOnboardingFlow({ driver });

        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });
});
