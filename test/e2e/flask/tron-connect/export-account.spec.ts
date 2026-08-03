import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { SubjectType } from '@metamask/permission-controller';
import { DAPP_URL, DEFAULT_TRON_ADDRESS } from '../../constants';
import { getCleanAppState } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { TestDappTron } from '../../page-objects/pages/test-dapp-tron';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS } from './testHelpers';
import { withTronAccountSnap } from './common-tron';

const TRON_SNAP_ID = 'npm:@metamask/tron-wallet-snap';
const PORTFOLIO_ORIGIN = 'https://portfolio.metamask.io';

async function mockPortfolioOrigin(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const endpoint = await mockServer
    .forGet(/^https:\/\/portfolio\.metamask\.io\//u)
    .thenCallback(() => ({
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<!DOCTYPE html><html><head><title>Portfolio</title></head><body></body></html>',
    }));
  return [endpoint];
}

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
                caveats: [{ type: 'snapIds', value: { [TRON_SNAP_ID]: {} } }],
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

async function getTronAccountId(driver: Driver) {
  const state = await getCleanAppState(driver);
  const accounts: Record<string, { id: string; address: string }> =
    state?.metamask?.internalAccounts?.accounts ?? {};
  const account = Object.values(accounts).find(
    (a) => a.address === DEFAULT_TRON_ADDRESS,
  );
  if (!account) {
    throw new Error(
      `Tron account with address ${DEFAULT_TRON_ADDRESS} not found in state`,
    );
  }
  return account.id;
}

describe('Tron Snap - exportAccount', function () {
  it('rejects exportAccount from an origin not in allowedOrigins', async function () {
    await withTronAccountSnap(
      {
        ...DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        fixtureCustomizer: grantSnapPermission(DAPP_URL),
      },
      async (driver) => {
        const accountId = await getTronAccountId(driver);

        // Open the test dapp so window.ethereum is available in the page context.
        // DAPP_URL (http://127.0.0.1:8080) is not in allowedOrigins, so the
        // snap's onKeyringRequest handler must reject the call.
        const testDappTron = new TestDappTron(driver);
        await testDappTron.openTestDappPage();

        const result: { success: boolean; error: string } =
          await driver.executeAsyncScript(`
            const callback = arguments[arguments.length - 1];
            const waitForEthereum = (resolve) => {
              if (window.ethereum) { resolve(); } else { setTimeout(() => waitForEthereum(resolve), 50); }
            };
            new Promise(waitForEthereum).then(() =>
              window.ethereum.request({
                method: 'wallet_invokeKeyring',
                params: {
                  snapId: '${TRON_SNAP_ID}',
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
        fixtureCustomizer: grantSnapPermission(PORTFOLIO_ORIGIN),
      },
      async (driver) => {
        const accountId = await getTronAccountId(driver);

        // Open a page at the portfolio origin. Chrome routes all HTTPS through
        // the mockttp proxy (--proxy-server=127.0.0.1:8000) which serves a
        // minimal HTML page for this host, so MetaMask's content script sees
        // the origin as https://portfolio.metamask.io.
        // This origin is in the snap manifest's allowedOrigins so it passes
        // the SnapController gate, but exportAccount is not in dapp permissions
        // so the snap itself rejects the call.
        await driver.openNewPage(PORTFOLIO_ORIGIN);

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
                  snapId: '${TRON_SNAP_ID}',
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
          'Permission denied',
          `Expected snap permission error, got: ${result.error}`,
        );
      },
    );
  });
});
