import { MockedEndpoint } from '../../mock-e2e';
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
import { seeAuthenticationRequest } from './mocks/authentication';

const newPassword = 'this is the best password ever';

describe('Forgot password', function () {
  it('resets password and then unlock wallet with new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: seeAuthenticationRequest,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
        mockedEndpoint,
      }: {
        driver: Driver;
        localNodes: Anvil[] | Ganache[] | undefined[];
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        await homePage.headerNavbar.checkPageIsLoaded();
        await homePage.headerNavbar.lockMetaMaskWithAuthWait(mockedEndpoint);

        // Click forgot password button and reset password
        await new LoginPage(driver).gotoResetPasswordPage();

        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();

        await resetPasswordPage.resetPassword(E2E_SRP, newPassword);
        await resetPasswordPage.waitForSeedPhraseInputToNotBeVisible();
        await homePage.headerNavbar.checkPageIsLoaded();

        // Lock wallet again
        await homePage.headerNavbar.lockMetaMask();

        // Check user can log in with new password
        await loginWithBalanceValidation(driver, localNodes[0], newPassword);
      },
    );
  });
});
