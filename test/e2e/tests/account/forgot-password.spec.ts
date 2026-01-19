import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import { E2E_SRP } from '../../fixtures/default-fixture';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const newPassword = 'this is the best password ever';

describe('Forgot password', function () {
  it('resets password and then unlock wallet with new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        // to avoid a race condition where some authentication requests are triggered once the wallet is locked
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'The snap "npm:@metamask/message-signing-snap" has been terminated during execution', // issue #37342
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.', // issue #37498
          'Legacy syncing failed for wallet', // issue #37053
        ],
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
        // Giving sometime for network calls to settle before locking metamask
        await driver.delay(3000);

        const homePage = new HomePage(driver);
        await homePage.headerNavbar.checkPageIsLoaded();
        await homePage.headerNavbar.lockMetaMask();

        // Click forgot password button and reset password
        await new LoginPage(driver).gotoResetPasswordPage();

        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();

        await resetPasswordPage.resetPassword(E2E_SRP, newPassword);
        await resetPasswordPage.waitForPasswordInputToNotBeVisible();
        await homePage.headerNavbar.checkPageIsLoaded();
        await driver.delay(1000); // to avoid a race condition where the wallet is not locked yet
        // Lock wallet again
        await homePage.headerNavbar.lockMetaMask();

        // Check user can log in with new password
        await loginWithBalanceValidation(driver, localNodes[0], newPassword);
      },
    );
  });
});
