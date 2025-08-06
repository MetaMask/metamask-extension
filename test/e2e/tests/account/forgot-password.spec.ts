import { Mockttp } from 'mockttp';
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

const newPassword = 'this is the best password ever';

async function seeAuthenticationRequest(mockServer: Mockttp) {
  return await mockServer
    .forPost('https://authentication.api.cx.metamask.io/api/v2/srp/login')
    // the goal is to know when this request happens, not to mock any specific response
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

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
        mockedEndpoint: MockedEndpoint;
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Lock Wallet
        // We need to wait for this request to happen, before locking the wallet, to avoid the error 'unable to proceed, wallet is locked'
        // https://github.com/MetaMask/core/blob/main/packages/profile-sync-controller/src/controllers/authentication/AuthenticationController.ts#L263
        await driver.waitUntil(
          async () => {
            const requests = await mockedEndpoint.getSeenRequests();
            console.log("Requests ==============", )
            return requests.length > 0;
          },
          { interval: 200, timeout: 10000 },
        );
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

        // debug
        await driver.delay(5000);
        await homePage.headerNavbar.lockMetaMask();

        // Check user can log in with new password
        await loginWithBalanceValidation(driver, localNodes[0], newPassword);
      },
    );
  });
});
