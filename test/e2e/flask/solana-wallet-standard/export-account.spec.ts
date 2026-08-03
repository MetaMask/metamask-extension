import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { SubjectType } from '@metamask/permission-controller';
import { DAPP_URL, DEFAULT_FIXTURE_SOLANA_ACCOUNT, DAPP_PATH } from '../../constants';
import { getCleanAppState, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';

const SOLANA_SNAP_ID = 'npm:@metamask/solana-wallet-snap';
const PORTFOLIO_ORIGIN = 'https://portfolio.metamask.io';

async function mockPortfolioOrigin(mockServer: Mockttp): Promise<MockedEndpoint[]> {
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
                caveats: [{ type: 'snapIds', value: { [SOLANA_SNAP_ID]: {} } }],
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

async function getSolanaAccountId(driver: Driver) {
  const state = await getCleanAppState(driver);
  const accounts: Record<string, { id: string; address: string }> =
    state?.metamask?.internalAccounts?.accounts ?? {};
  const account = Object.values(accounts).find(
    (a) => a.address === DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  );
  if (!account) {
    throw new Error(
      `Solana account with address ${DEFAULT_FIXTURE_SOLANA_ACCOUNT} not found in state`,
    );
  }
  return account.id;
}

async function withSolanaExportAccountTest(
  {
    title,
    additionalMocks,
    fixtureCustomizer,
  }: {
    title?: string;
    additionalMocks?: (mockServer: Mockttp) => Promise<MockedEndpoint[]>;
    fixtureCustomizer?: (builder: FixtureBuilderV2) => FixtureBuilderV2;
  },
  test: (driver: Driver) => Promise<void>,
) {
  let builder = new FixtureBuilderV2();
  if (fixtureCustomizer) {
    builder = fixtureCustomizer(builder);
  }

  await withFixtures(
    {
      fixtures: builder.build(),
      title,
      dapp: true,
      dappOptions: {
        numberOfTestDapps: 1,
        customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        ...(additionalMocks ? await additionalMocks(mockServer) : []),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await login(driver);
      await test(driver);
    },
  );
}

describe('Solana Snap - exportAccount', function () {
  it('rejects exportAccount from an origin not in allowedOrigins', async function () {
    await withSolanaExportAccountTest(
      {
        title: this.test?.fullTitle(),
        fixtureCustomizer: grantSnapPermission(DAPP_URL),
      },
      async (driver) => {
        const accountId = await getSolanaAccountId(driver);

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
                  snapId: '${SOLANA_SNAP_ID}',
                  request: { method: 'keyring_exportAccount', params: { id: '${accountId}' } }
                }
              })
            )
            .then(() => callback({ success: true }))
            .catch((e) => callback({ success: false, error: e.message }));
          `);

        assert.equal(result.success, false, 'Expected rejection but got success');
        assert.equal(
          result.error,
          `Snap "${SOLANA_SNAP_ID}" is not permitted to handle requests from "${DAPP_URL}".`,
          `Expected SnapController origin error, got: ${result.error}`,
        );
      },
    );
  });

  it('rejects exportAccount even from an origin in allowedOrigins', async function () {
    await withSolanaExportAccountTest(
      {
        title: this.test?.fullTitle(),
        additionalMocks: mockPortfolioOrigin,
        fixtureCustomizer: grantSnapPermission(PORTFOLIO_ORIGIN),
      },
      async (driver) => {
        const accountId = await getSolanaAccountId(driver);

        // Portfolio passes the SnapController gate (it's in the manifest's
        // allowedOrigins) but is rejected by the snap's own permission check
        // because exportAccount is not in dapp permissions.
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
                  snapId: '${SOLANA_SNAP_ID}',
                  request: { method: 'keyring_exportAccount', params: { id: '${accountId}' } }
                }
              })
            )
            .then(() => callback({ success: true }))
            .catch((e) => callback({ success: false, error: e.message }));
          `);

        assert.equal(result.success, false, 'Expected rejection but got success');
        assert.equal(
          result.error,
          'Permission denied',
          `Expected snap permission error, got: ${result.error}`,
        );
      },
    );
  });
});
