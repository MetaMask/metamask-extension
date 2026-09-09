import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import { lockAndWaitForLoginPage } from '../../page-objects/flows/login.flow';

describe('Reset Wallet - ', function () {
  it('creates a new wallet with SRP and completes the onboarding process after resetting the wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: [
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

        await lockAndWaitForLoginPage(driver);
        const loginPage = new LoginPage(driver);

        // Reset wallet via forgot password -> "I don't know my Recovery Phrase"
        await loginPage.resetWalletFromForgotPassword();

        // Complete onboarding again with SRP create.
        // needNavigateToNewPage must be false: the wallet reset is async —
        // `resetWalletFromForgotPassword` resolves as soon as the modal
        // closes, but the background `resetWallet` RPC is still in flight.
        // A full-page `driver.navigate()` at this point would reload
        // home.html before the reset finishes, so the app shows the home
        // page instead of redirecting to onboarding.
        // With `false`, the flow waits for the onboarding welcome page to
        // appear naturally once the background reset completes and the React
        // Router navigates to DEFAULT_ROUTE.
        await completeCreateNewWalletOnboardingFlow({
          driver,
          skipSRPBackup: true,
          needNavigateToNewPage: false,
        });

        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });

  it('imports an SRP and completes the onboarding process after resetting the wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: [
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

        await lockAndWaitForLoginPage(driver);
        const loginPage = new LoginPage(driver);

        // Reset wallet via forgot password -> "I don't know my Recovery Phrase"
        await loginPage.resetWalletFromForgotPassword();

        // Complete onboarding again by importing SRP.
        // See the first test for why needNavigateToNewPage must be false.
        await completeImportSRPOnboardingFlow({
          driver,
          needNavigateToNewPage: false,
        });

        await homePage.headerNavbar.checkPageIsLoaded();
      },
    );
  });
});
