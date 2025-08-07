import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { E2E_SRP } from '../../default-fixture';
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

        const homePage = new HomePage(driver);
        await homePage.headerNavbar.check_pageIsLoaded();
        await homePage.headerNavbar.lockMetaMask();

        // Click forgot password button and reset password
        await new LoginPage(driver).gotoResetPasswordPage();

        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.check_pageIsLoaded();

        await resetPasswordPage.resetPassword(E2E_SRP, newPassword);
        await resetPasswordPage.waitForSeedPhraseInputToNotBeVisible();
        await homePage.headerNavbar.check_pageIsLoaded();

        // Lock wallet again
        await homePage.headerNavbar.lockMetaMask();

        // Check user can log in with new password
        await loginWithBalanceValidation(driver, localNodes[0], newPassword);
      },
    );
  });
});
