import { strict as assert } from 'assert';
import { DAPP_URL, DEFAULT_BTC_ADDRESS } from '../../constants';
import {
  getAccountIdByAddress,
  grantSnapPermission,
  invokeKeyringExportAccount,
} from '../export-account-helpers';
import { withBtcWalletStandardSnap } from './testHelpers';

const BITCOIN_SNAP_ID = 'npm:@metamask/bitcoin-wallet-snap';

describe('Bitcoin Snap - exportAccount', function () {
  it('rejects exportAccount from an origin not in allowedOrigins', async function () {
    await withBtcWalletStandardSnap(
      {
        title: this.test?.fullTitle(),
        fixtureCustomizer: grantSnapPermission(BITCOIN_SNAP_ID, DAPP_URL),
      },
      async (driver) => {
        const accountId = await getAccountIdByAddress(
          driver,
          DEFAULT_BTC_ADDRESS,
        );

        await driver.openNewPage(DAPP_URL);

        const result = await invokeKeyringExportAccount(
          driver,
          BITCOIN_SNAP_ID,
          accountId,
        );

        assert.equal(
          result.success,
          false,
          'Expected rejection but got success',
        );
        assert.equal(
          result.error,
          `Snap "${BITCOIN_SNAP_ID}" is not permitted to handle requests from "${DAPP_URL}".`,
          `Expected SnapController origin error, got: ${result.error}`,
        );
      },
    );
  });
});
