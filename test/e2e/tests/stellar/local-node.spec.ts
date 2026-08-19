import { Suite } from 'mocha';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { isDockerAvailable } from '../../seeder/stellar/node';
import { Driver } from '../../webdriver/driver';
import { withStellarFixture } from './fixtures/with-stellar-fixture';
import { STELLAR_NATIVE_TOKEN_NAME } from './mocks/common-stellar';

/** Snap balance sync after switching to Stellar. */
const STELLAR_LOCAL_NODE_ASSET_LIST_TIMEOUT_MS = 45_000;

/**
 * Stellar live-chain smoke E2E.
 *
 * `withStellarFixture` starts `stellar/quickstart` in Docker and funds Account 1
 * via Friendbot. The wallet stays on built-in Stellar; Horizon / Soroban RPC
 * Infura calls are proxied to that container — no custom network.
 *
 * Skips when Docker is not available so the rest of the suite still runs.
 */
describe('Stellar - local Quickstart node', function (this: Suite) {
  this.timeout(600_000);

  it('shows XLM funded by Friendbot on the local Docker node', async function () {
    if (!(await isDockerAvailable())) {
      this.skip();
    }

    await withStellarFixture(
      {
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);
        await driver.refresh();
        await new HomePage(driver).checkPageIsLoaded();

        await new TokensTab(driver).checkTokenExistsInList(
          STELLAR_NATIVE_TOKEN_NAME,
          undefined,
          { timeout: STELLAR_LOCAL_NODE_ASSET_LIST_TIMEOUT_MS },
        );
      },
    );
  });
});
