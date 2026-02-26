import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';

describe('Reset Wallet - ', function () {
  it('creates a new wallet with SRP and completes the onboarding process after resetting the wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution', // issue #37342
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        // Complete initial onboarding with SRP create
        await completeCreateNewWalletOnboardingFlow({
          driver,
          skipSRPBackup: true,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        // Reset wallet via forgot password -> "I don't know my Recovery Phrase"
        await loginPage.resetWalletFromForgotPassword();

        // Complete onboarding again with SRP create
        await completeCreateNewWalletOnboardingFlow({
          driver,
          skipSRPBackup: true,
        });

        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });

  it('imports an SRP and completes the onboarding process after resetting the wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution', // issue #37342
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        // Complete initial onboarding with SRP create
        await completeCreateNewWalletOnboardingFlow({
          driver,
          skipSRPBackup: true,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.lockMetaMask();

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();

        // Reset wallet via forgot password -> "I don't know my Recovery Phrase"
        await loginPage.resetWalletFromForgotPassword();

        // Complete onboarding again by importing SRP
        await completeImportSRPOnboardingFlow({ driver });

        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });
});
