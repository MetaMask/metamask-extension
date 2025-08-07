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
