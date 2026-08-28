import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { getCleanAppState, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { DEFAULT_FIXTURE_ACCOUNT_ID, NETWORK_CLIENT_ID } from '../../constants';

/** Above Mockttp's `RulePriority.DEFAULT`, so these rules beat the global mocks. */
const MOCK_OVERRIDE_PRIORITY = 99;

/**
 * Live `GET token.api.cx.metamask.io/v1/suggestedOccurrenceFloors` payload.
 * Chains missing from the map fall back to the controller's default floor of
 * 3, which is what BNB Chain (56) and Polygon (137) rely on below.
 */
const SUGGESTED_OCCURRENCE_FLOORS = {
  1: 3,
  143: 1,
  204: 1,
  232: 1,
  690: 1,
  1329: 1,
  4663: 1,
  10143: 1,
  59144: 1,
  98866: 1,
};

type TrackedAsset = {
  assetId: `${string}:${string}/${string}:${string}`;
  name: string;
  symbol: string;
  decimals: number;
  /** `occurrences` as returned by `GET tokens.api.cx.metamask.io/v3/assets`. */
  occurrences: number;
  amount: string;
};

/**
 * Real airdropped spam tokens across Ethereum, BNB Chain and Polygon. Every
 * field (including `occurrences`) is the live Token API value, so all eight sit
 * below their chain's occurrence floor and must be cleaned up.
 */
const SPAM_ASSETS: TrackedAsset[] = [
  {
    assetId: 'eip155:1/erc20:0xC12D1c73eE7DC3615BA4e37E4ABFdbDDFA38907E',
    name: 'KickToken',
    symbol: 'KICK',
    decimals: 8,
    occurrences: 1,
    amount: '888888',
  },
  {
    assetId: 'eip155:56/erc20:0xA1B99485D58D70D86E455Ab8823492090C3F43C0',
    name: 'Ape-Swap.io',
    symbol: 'APE',
    decimals: 18,
    occurrences: 1,
    amount: '350',
  },
  {
    assetId: 'eip155:56/erc20:0xD22202d23fE7dE9E3DbE11a2a88F42f4CB9507cf',
    name: 'Minereum BSC',
    symbol: 'MNEB',
    decimals: 8,
    occurrences: 1,
    amount: '150000',
  },
  {
    assetId: 'eip155:56/erc20:0x3c46e6A6a25bAe4520B6BEB545f31c5280FcC0f7',
    name: 'My Get Rich Token',
    symbol: 'MGRT',
    decimals: 18,
    occurrences: 1,
    amount: '120000.576',
  },
  {
    assetId: 'eip155:137/erc20:0xdC8Fa3FaB8421ff44cc6CA7f966673FF6c0B3B58',
    name: 'Draf.io',
    symbol: 'DRAF.IO',
    decimals: 18,
    occurrences: 1,
    amount: '288101',
  },
  {
    assetId: 'eip155:137/erc20:0x68CaF7335aA11188D9d91E1c9a5ab73a6de827bE',
    name: 'GrandpaGreen',
    symbol: 'GGREEN',
    decimals: 18,
    occurrences: 1,
    amount: '999',
  },
  {
    assetId: 'eip155:137/erc20:0xfAE400Bf04f88E47D899CFe7e7C16bf8c8AE919b',
    name: 'Pikatic',
    symbol: 'PKT',
    decimals: 18,
    occurrences: 1,
    amount: '220000',
  },
  {
    assetId: 'eip155:137/erc20:0x6b9a80572382159D3656ea43beA144f1151ccce7',
    name: 'Rotomico',
    symbol: 'RTM',
    decimals: 18,
    occurrences: 1,
    amount: '850000',
  },
];

/** Widely-listed token, well above the mainnet floor of 3. */
const LEGITIMATE_ASSET: TrackedAsset = {
  assetId: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  name: 'USDC',
  symbol: 'USDC',
  decimals: 6,
  occurrences: 10,
  amount: '250',
};

/**
 * Below the occurrence floor, but the user imported it by hand. Custom assets
 * are excluded from cleanup so that a deliberate import is never reverted.
 */
const CUSTOM_ASSET: TrackedAsset = {
  assetId: 'eip155:56/erc20:0x9C121B7CB6C0CFBFbC1E1a73dd8D9172a79D399A',
  name: 'BananaCat',
  symbol: 'BCT',
  decimals: 18,
  occurrences: 1,
  amount: '42000',
};

const MUSD_ASSET: TrackedAsset = {
  assetId: 'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
  name: 'MetaMask USD',
  symbol: 'MUSD',
  decimals: 18,
  occurrences: 1,
  amount: '0',
};

const TRACKED_ASSETS: TrackedAsset[] = [
  ...SPAM_ASSETS,
  LEGITIMATE_ASSET,
  CUSTOM_ASSET,
  MUSD_ASSET, // Adding to avoid future balance flakiness with mUSD token addition
];

/** Native rows seeded for the enabled networks by the default fixture. */
const NATIVE_TOKEN_NAMES = ['Ethereum', 'BNB', 'POL'];

function buildFixtures(title: string) {
  return {
    title,
    fixtures: new FixtureBuilderV2()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.BSC]: true,
          [CHAIN_IDS.POLYGON]: true,
        },
      })
      .withAssetsController({
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: Object.fromEntries(
            TRACKED_ASSETS.map(({ assetId, amount }) => [assetId, { amount }]),
          ),
        },
        assetsInfo: Object.fromEntries(
          TRACKED_ASSETS.map(({ assetId, name, symbol, decimals }) => [
            assetId,
            { type: 'erc20' as const, aggregators: [], decimals, name, symbol },
          ]),
        ),
        customAssets: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: [CUSTOM_ASSET.assetId],
        },
      })
      .build(),
  };
}

/**
 * Mocks the two Token API endpoints the spam cleanup depends on. Both run at a
 * raised priority so they win over the global mocks in `mock-e2e.js`, which
 * Mockttp would otherwise prefer because they are registered first.
 *
 * The `/v3/assets` mock is scoped to `includeOccurrences=true` so it only
 * answers spam-filter lookups, leaving plain metadata lookups to the global
 * mock.
 *
 * @param mockServer - Mockttp instance.
 * @param options - Mock options.
 * @param options.failOccurrenceFloors - Serve a 500 from
 * `/v1/suggestedOccurrenceFloors`, which makes the cleanup fail closed.
 */
async function mockOccurrenceApis(
  mockServer: Mockttp,
  { failOccurrenceFloors = false }: { failOccurrenceFloors?: boolean } = {},
) {
  return [
    await mockServer
      .forGet(`https://token.api.cx.metamask.io/v1/suggestedOccurrenceFloors`)
      .always()
      .thenCallback(() =>
        failOccurrenceFloors
          ? { statusCode: 500, json: { message: 'Internal server error' } }
          : { statusCode: 200, json: SUGGESTED_OCCURRENCE_FLOORS },
      ),
    await mockServer
      .forGet(`https://tokens.api.cx.metamask.io/v3/assets`)
      .withQuery({ includeOccurrences: 'true' })
      .always()
      .thenCallback((request) => {
        const requested = new Set(
          new URL(request.url).searchParams
            .getAll('assetIds')
            .flatMap((value) => value.split(','))
            .map((assetId) => assetId.toLowerCase()),
        );

        return {
          statusCode: 200,
          json: TRACKED_ASSETS.filter(({ assetId }) =>
            requested.has(assetId.toLowerCase()),
          ).map(({ assetId, name, symbol, decimals, occurrences }) => ({
            // The live API echoes asset IDs in lowercase.
            assetId: assetId.toLowerCase(),
            name,
            symbol,
            decimals,
            occurrences,
          })),
        };
      }),

    // Mock balances as so it doesn't impact the original cleanup unlock logic.
    await mockServer
      .forGet(`https://accounts.api.cx.metamask.io/v5/multiaccount/balances`)
      .always()
      .thenCallback((request) => {
        const accountIds = (
          new URL(request.url).searchParams.get('accountIds') ?? ''
        )
          .split(',')
          .filter(Boolean);

        const keptAssets = failOccurrenceFloors
          ? TRACKED_ASSETS
          : [LEGITIMATE_ASSET, CUSTOM_ASSET];
        const balances = [];
        for (const accountId of accountIds) {
          const chainRef = accountId.split(':')[1];
          balances.push({
            accountId,
            assetId: `eip155:${chainRef}/slip44:60`,
            balance: '25',
          });
          for (const { assetId, amount } of keptAssets) {
            if (assetId.startsWith(`eip155:${chainRef}/`)) {
              balances.push({ accountId, assetId, balance: amount });
            }
          }
        }

        return {
          statusCode: 200,
          json: {
            count: balances.length,
            balances,
            unprocessedNetworks: [],
          },
        };
      }),
  ];
}

/**
 * Reads the persisted asset slices as projected onto the UI store, so the
 * assertions cover the cleaned controller state rather than only the rendered
 * list. Callers must first wait on the UI so the cleanup has settled.
 *
 * @param driver - WebDriver instance.
 * @returns The account's tracked asset IDs, keyed by state slice.
 */
async function getTrackedAssetIds(driver: Driver): Promise<{
  assetsInfo: string[];
  assetsBalance: string[];
}> {
  const uiState = (await getCleanAppState(driver)) as {
    metamask: {
      assetsInfo: Record<string, unknown>;
      assetsBalance: Record<string, Record<string, unknown>>;
    };
  };

  return {
    assetsInfo: Object.keys(uiState.metamask.assetsInfo),
    assetsBalance: Object.keys(
      uiState.metamask.assetsBalance[DEFAULT_FIXTURE_ACCOUNT_ID] ?? {},
    ),
  };
}

describe('Spam token cleanup', function (this: Suite) {
  it('removes below-floor spam tokens from persisted state on unlock', async function () {
    await withFixtures(
      {
        ...buildFixtures(this.test?.fullTitle() as string),
        testSpecificMock: async (mockServer: Mockttp) =>
          mockOccurrenceApis(mockServer),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          LEGITIMATE_ASSET.name,
          `${LEGITIMATE_ASSET.amount} ${LEGITIMATE_ASSET.symbol}`,
        );
        await tokensTab.checkOnlyAssetsArePresent([
          ...NATIVE_TOKEN_NAMES,
          LEGITIMATE_ASSET.name,
          CUSTOM_ASSET.name,
          MUSD_ASSET.name,
        ]);

        const { assetsInfo, assetsBalance } = await getTrackedAssetIds(driver);
        for (const { assetId, name } of SPAM_ASSETS) {
          assert.ok(
            !assetsInfo.includes(assetId),
            `Expected ${name} to be removed from assetsInfo`,
          );
          assert.ok(
            !assetsBalance.includes(assetId),
            `Expected ${name} to be removed from assetsBalance`,
          );
        }
        for (const { assetId, name } of [LEGITIMATE_ASSET, CUSTOM_ASSET]) {
          assert.ok(
            assetsInfo.includes(assetId),
            `Expected ${name} to be kept in assetsInfo`,
          );
          assert.ok(
            assetsBalance.includes(assetId),
            `Expected ${name} to be kept in assetsBalance`,
          );
        }
      },
    );
  });

  it('leaves persisted spam tokens untouched when the occurrence floor API fails', async function () {
    await withFixtures(
      {
        ...buildFixtures(this.test?.fullTitle() as string),
        testSpecificMock: async (mockServer: Mockttp) =>
          mockOccurrenceApis(mockServer, { failOccurrenceFloors: true }),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkOnlyAssetsArePresent([
          ...NATIVE_TOKEN_NAMES,
          ...SPAM_ASSETS.map(({ name }) => name),
          LEGITIMATE_ASSET.name,
          CUSTOM_ASSET.name,
          MUSD_ASSET.name,
        ]);
      },
    );
  });
});
