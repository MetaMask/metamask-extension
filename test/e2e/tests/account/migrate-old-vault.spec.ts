import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { MockedEndpoint } from '../../mock-e2e';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

async function seeAuthenticationRequest(mockServer: Mockttp) {
  // the goal is to know when these requests happen, not to mock any specific response
  return [
    await mockServer
    .forPost('https://authentication.api.cx.metamask.io/api/v2/srp/login')
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    }),
    await mockServer
      .forGet('https://authentication.api.cx.metamask.io/api/v2/profile/lineage')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            lineage: [
              {
                agent: 'mobile',
                metametrics_id: '0xdeadbeef',
                created_at: '2021-01-01',
                updated_at: '2021-01-01',
                counter: 1,
              },
            ],
            created_at: '2025-07-16T10:03:57Z',
            profile_id: '0deaba86-4b9d-4137-87d7-18bc5bf7708d',
          },
        };
      }),
    ];
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
        mockedEndpoint: MockedEndpoint[];
        }) => {
        await loginWithBalanceValidation(driver);

        // We need to wait for this request to happen, before locking the wallet, to avoid the error 'unable to proceed, wallet is locked'
        // https://github.com/MetaMask/core/blob/main/packages/profile-sync-controller/src/controllers/authentication/AuthenticationController.ts#L263
        await driver.waitUntil(
          async () => {
            const isPending = await mockedEndpoint[0].isPending();
            return isPending === false;
          },
          { interval: 200, timeout: 10000 },
        );
         await driver.waitUntil(
          async () => {
            const isPending = await mockedEndpoint[1].isPending();
            return isPending === false;
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
