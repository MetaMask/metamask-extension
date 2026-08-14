import { strict as assert } from 'assert';
import { DAPP_URL, DEFAULT_TRON_ADDRESS } from '../../constants';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import {
  PORTFOLIO_ORIGIN,
  getAccountIdByAddress,
  grantSnapPermission,
  invokeKeyringExportAccount,
  mockPortfolioOrigin,
} from '../export-account-helpers';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap } from './common-tron';

const TRON_SNAP_ID = 'npm:@metamask/tron-wallet-snap';

describe('Tron Snap - exportAccount', function () {
  it('rejects exportAccount from an origin not in allowedOrigins', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        fixtureCustomizer: grantSnapPermission(TRON_SNAP_ID, DAPP_URL),
      },
      async (driver) => {
        const accountId = await getAccountIdByAddress(
          driver,
          DEFAULT_TRON_ADDRESS,
        );

        // Open the test dapp so window.ethereum is available in the page context.
        // DAPP_URL (http://127.0.0.1:8080) is not in allowedOrigins, so the
        // snap's onKeyringRequest handler must reject the call.
        const testDappTron = new TestDappTron(driver);
        await testDappTron.openTestDappPage();

        const result = await invokeKeyringExportAccount(
          driver,
          TRON_SNAP_ID,
          accountId,
        );

        assert.equal(
          result.success,
          false,
          'Expected rejection but got success',
        );
        assert.equal(
          result.error,
          `Snap "${TRON_SNAP_ID}" is not permitted to handle requests from "${DAPP_URL}".`,
          `Expected SnapController origin error, got: ${result.error}`,
        );
      },
    );
  });

  it('rejects exportAccount even from an origin in allowedOrigins', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        additionalMocks: mockPortfolioOrigin,
        fixtureCustomizer: grantSnapPermission(TRON_SNAP_ID, PORTFOLIO_ORIGIN),
      },
      async (driver) => {
        const accountId = await getAccountIdByAddress(
          driver,
          DEFAULT_TRON_ADDRESS,
        );

        // Open a page at the portfolio origin. Chrome routes all HTTPS through
        // the mockttp proxy (--proxy-server=127.0.0.1:8000) which serves a
        // minimal HTML page for this host, so MetaMask's content script sees
        // the origin as https://portfolio.metamask.io.
        // This origin is in the snap manifest's allowedOrigins so it passes
        // the SnapController gate, but exportAccount is not in dapp permissions
        // so the snap itself rejects the call.
        await driver.openNewPage(PORTFOLIO_ORIGIN);

        const result = await invokeKeyringExportAccount(
          driver,
          TRON_SNAP_ID,
          accountId,
        );

        assert.equal(
          result.success,
          false,
          'Expected rejection but got success',
        );
        assert.equal(
          result.error,
          'Permission denied',
          `Expected snap permission error, got: ${result.error}`,
        );
      },
    );
  });
});
