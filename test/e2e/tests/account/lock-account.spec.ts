import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MockedEndpoint } from '../../mock-e2e';
import { Mockttp } from 'mockttp';

const AUTHENTICATION_BASE_URL = 'https://authentication.api.cx.metamask.io/api/v2';

async function seeAuthenticationRequest(mockServer: Mockttp) {
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

describe('Lock and unlock', function (this: Suite) {
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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
        await homePage.headerNavbar.lockMetaMask();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
