import assert from 'node:assert/strict';
import { Suite } from 'mocha';
import type { CompletedRequest, MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  mockTronApisInactiveAccountWithTrc20Fallback,
  TRON_ACCOUNT_ADDRESS,
} from './mocks/common-tron';

async function collectSeenRequests(
  mockedEndpoint: MockedEndpoint | MockedEndpoint[],
): Promise<CompletedRequest[]> {
  const endpoints = Array.isArray(mockedEndpoint)
    ? mockedEndpoint
    : [mockedEndpoint];
  const out: CompletedRequest[] = [];
  for (const ep of endpoints) {
    out.push(...(await ep.getSeenRequests()));
  }
  return out;
}

/**
 * NEB-461: inactive Tron addresses (account-info request fails) still trigger
 * GET /v1/accounts/{address}/trc20/balance in the Tron snap so TRC20 balances
 * can be merged into assets.
 */
describe('Tron inactive account TRC20 fallback (NEB-461)', function (this: Suite) {
  it('calls trc20/balance when v1/accounts/{address} fails', async function () {
    const testTitle = this.test?.fullTitle() ?? 'neb-461-inactive-trc20-fallback';

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: testTitle,
        testSpecificMock: (mockServer: Mockttp) =>
          mockTronApisInactiveAccountWithTrc20Fallback(mockServer),
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint | MockedEndpoint[];
      }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '0 TRX' });

        // Evidence: Tron selected under inactive-address mocks (404 account info + trc20/balance hit).
        await driver.takeScreenshot(
          testTitle,
          'neb-461-inactive-edge-contract-tron-home-0-trx',
        );

        const seen = await collectSeenRequests(mockedEndpoint);
        const accountSuffix = `/v1/accounts/${TRON_ACCOUNT_ADDRESS}`;
        const trc20BalanceSuffix = `${accountSuffix}/trc20/balance`;

        // Mockttp `path` includes the Infura prefix, e.g. /v3/{key}/v1/accounts/{addr}
        const sawAccountInfo = seen.some(
          (r) => r.method === 'GET' && r.path.endsWith(accountSuffix),
        );
        const sawTrc20BalanceFallback = seen.some(
          (r) => r.method === 'GET' && r.path.endsWith(trc20BalanceSuffix),
        );

        assert.ok(
          sawAccountInfo,
          `expected a GET ending with ${accountSuffix} (account info)`,
        );
        assert.ok(
          sawTrc20BalanceFallback,
          `expected a GET ending with ${trc20BalanceSuffix} (inactive-address TRC20 fallback)`,
        );
      },
    );
  });
});
