import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { MockedEndpoint } from '../../mock-e2e';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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

describe('Migrate vault with old encryption', function (this: Suite) {
  it('successfully unlocks an old vault, locks it, and unlocks again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        testSpecificMock: seeAuthenticationRequest,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint;
      }) => {
        await loginWithBalanceValidation(driver);

        // We need to wait for this request to happen, before locking the wallet, to avoid the error 'unable to proceed, wallet is locked'
        // https://github.com/MetaMask/core/blob/main/packages/profile-sync-controller/src/controllers/authentication/AuthenticationController.ts#L263
        await driver.waitUntil(
          async () => {
            const requests = await mockedEndpoint.getSeenRequests();
            return requests.length > 0;
          },
          { interval: 200, timeout: 10000 },
        );

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.lockMetaMask();
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
