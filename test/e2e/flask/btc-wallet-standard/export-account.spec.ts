import { strict as assert } from 'assert';
import { SubjectType } from '@metamask/permission-controller';
import { DAPP_URL, DEFAULT_BTC_ADDRESS } from '../../constants';
import { getCleanAppState } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withBtcWalletStandardSnap } from './testHelpers';

const BITCOIN_SNAP_ID = 'npm:@metamask/bitcoin-wallet-snap';

function grantSnapPermission(origin: string) {
  return (builder: FixtureBuilderV2): FixtureBuilderV2 =>
    builder
      .withPermissionController({
        subjects: {
          [origin]: {
            origin,
            permissions: {
              /* eslint-disable @typescript-eslint/naming-convention */
              wallet_snap: {
                caveats: [
                  { type: 'snapIds', value: { [BITCOIN_SNAP_ID]: {} } },
                ],
                date: 1770296204693,
                id: `snap-perm-${origin}`,
                invoker: origin,
                parentCapability: 'wallet_snap',
              },
              /* eslint-enable @typescript-eslint/naming-convention */
            },
          },
        },
      })
      .withSubjectMetadataController({
        subjectMetadata: {
          [origin]: {
            origin,
            subjectType: SubjectType.Website,
            name: '',
            iconUrl: null,
            extensionId: null,
          },
        },
      });
}

async function getBitcoinAccountId(driver: Driver) {
  const state = await getCleanAppState(driver);
  const accounts: Record<string, { id: string; address: string }> =
    state?.metamask?.internalAccounts?.accounts ?? {};
  const account = Object.values(accounts).find(
    (a) => a.address === DEFAULT_BTC_ADDRESS,
  );
  if (!account) {
    throw new Error(
      `Bitcoin account with address ${DEFAULT_BTC_ADDRESS} not found in state`,
    );
  }
  return account.id;
}

describe('Bitcoin Snap - exportAccount', function () {
  it('rejects exportAccount from an origin not in allowedOrigins', async function () {
    await withBtcWalletStandardSnap(
      {
        title: this.test?.fullTitle(),
        fixtureCustomizer: grantSnapPermission(DAPP_URL),
      },
      async (driver) => {
        const accountId = await getBitcoinAccountId(driver);

        await driver.openNewPage(DAPP_URL);

        const result: { success: boolean; error?: string } =
          await driver.executeAsyncScript(`
            const callback = arguments[arguments.length - 1];
            const waitForEthereum = (resolve) => {
              if (window.ethereum) { resolve(); } else { setTimeout(() => waitForEthereum(resolve), 50); }
            };
            new Promise(waitForEthereum).then(() =>
              window.ethereum.request({
                method: 'wallet_invokeKeyring',
                params: {
                  snapId: '${BITCOIN_SNAP_ID}',
                  request: { method: 'keyring_exportAccount', params: { id: '${accountId}' } }
                }
              })
            )
            .then(() => callback({ success: true }))
            .catch((e) => callback({ success: false, error: e.message }));
          `);

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
