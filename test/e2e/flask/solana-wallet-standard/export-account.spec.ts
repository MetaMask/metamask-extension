import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import {
  DAPP_URL,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  DAPP_PATH,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  PORTFOLIO_ORIGIN,
  getAccountIdByAddress,
  grantSnapPermission,
  invokeKeyringExportAccount,
  mockPortfolioOrigin,
} from '../export-account-helpers';

const SOLANA_SNAP_ID = 'npm:@metamask/solana-wallet-snap';

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
  runExportAccountScenario: (driver: Driver) => Promise<void>,
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
      await runExportAccountScenario(driver);
    },
  );
}

describe('Solana Snap - exportAccount', function () {
  it('rejects exportAccount from an origin not in allowedOrigins', async function () {
    await withSolanaExportAccountTest(
      {
        title: this.test?.fullTitle(),
        fixtureCustomizer: grantSnapPermission(SOLANA_SNAP_ID, DAPP_URL),
      },
      async (driver) => {
        const accountId = await getAccountIdByAddress(
          driver,
          DEFAULT_FIXTURE_SOLANA_ACCOUNT,
        );

        await driver.openNewPage(DAPP_URL);

        const result = await invokeKeyringExportAccount(
          driver,
          SOLANA_SNAP_ID,
          accountId,
        );

        assert.equal(
          result.success,
          false,
          'Expected rejection but got success',
        );
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
        fixtureCustomizer: grantSnapPermission(
          SOLANA_SNAP_ID,
          PORTFOLIO_ORIGIN,
        ),
      },
      async (driver) => {
        const accountId = await getAccountIdByAddress(
          driver,
          DEFAULT_FIXTURE_SOLANA_ACCOUNT,
        );

        // Portfolio passes the SnapController gate (it's in the manifest's
        // allowedOrigins) but is rejected by the snap's own permission check
        // because exportAccount is not in dapp permissions.
        await driver.openNewPage(PORTFOLIO_ORIGIN);

        const result = await invokeKeyringExportAccount(
          driver,
          SOLANA_SNAP_ID,
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
