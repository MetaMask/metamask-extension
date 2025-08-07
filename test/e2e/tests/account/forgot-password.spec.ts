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
const AUTHENTICATION_BASE_URL = 'https://authentication.api.cx.metamask.io/api/v2';

async function seeAuthenticationRequest(mockServer: Mockttp) {
  // Helper function to create lineage endpoint with specific counter
  const createLineageEndpoint = (counter: number) =>
    mockServer
      .forGet(`${AUTHENTICATION_BASE_URL}/profile/lineage`)
      .once()
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
                counter,
              },
            ],
            created_at: '2025-07-16T10:03:57Z',
            profile_id: '0deaba86-4b9d-4137-87d7-18bc5bf7708d',
          },
        };
      });

  // the goal is to know when these requests happen, not to mock any specific response
  return [
    await mockServer
      .forPost(`${AUTHENTICATION_BASE_URL}/srp/login`)
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    // Create 3 separate mock endpoints for lineage to track each call
    await createLineageEndpoint(1),
    await createLineageEndpoint(2),
    await createLineageEndpoint(3),
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

        // We need to wait for all authentication requests to happen, before locking the wallet, to avoid the error 'unable to proceed, wallet is locked'
        // https://github.com/MetaMask/core/blob/main/packages/profile-sync-controller/src/controllers/authentication/AuthenticationController.ts#L263
        await driver.waitUntil(
          async () => {
            const pendingStatuses = await Promise.all([
              mockedEndpoint[0].isPending(), // srp login
              mockedEndpoint[1].isPending(), // lineage endpoint call 1
              mockedEndpoint[2].isPending(), // lineage endpoint call 2
              mockedEndpoint[3].isPending(), // lineage endpoint call 3
            ]);
            return pendingStatuses.every(status => status === false);
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
