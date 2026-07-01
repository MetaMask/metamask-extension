import { merge } from 'lodash';
import { Mockttp, MockedEndpoint } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  mockAccountsApiV2EvmOnlySupportedNetworks,
  mockAccountsApiV5EvmOnlyBalances,
} from '../../helpers/mocks/accounts-api-evm-only';

/** Solana account id used in default multichain fixtures. */
export const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';

export const SOL_CAIP_ASSET =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

export const SOLANA_WALLET_ADDRESS =
  '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';

/** Matches `mockPriceApiSpotPrice` in common-solana (50 SOL → $5,643.50). */
export const SOL_SPOT_PRICE_USD = 112.87;

export const SOL_BALANCE_HUMAN = '50';

const SOLANA_NATIVE_ASSETS_CONTROLLER_FIXTURE = {
  assetsBalance: {
    [SOL_ACCOUNT_ID]: {
      [SOL_CAIP_ASSET]: {
        amount: SOL_BALANCE_HUMAN,
      },
    },
  },
  assetsInfo: {
    [SOL_CAIP_ASSET]: {
      decimals: 9,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
      name: 'Solana',
      symbol: 'SOL',
      type: 'native',
    },
  },
  assetsPrice: {
    [SOL_CAIP_ASSET]: {
      assetPriceType: 'fungible' as const,
      id: 'solana',
      lastUpdated: 0,
      price: SOL_SPOT_PRICE_USD,
      usdPrice: SOL_SPOT_PRICE_USD,
    },
  },
};

const MULTICHAIN_SOL_ASSETS_PATCH = {
  MultichainAssetsController: {
    accountsAssets: {
      [SOL_ACCOUNT_ID]: [SOL_CAIP_ASSET],
    },
  },
  MultichainRatesController: {
    conversionRates: {
      [SOL_CAIP_ASSET]: {
        conversionTime: 1770832998.066,
        rate: String(SOL_SPOT_PRICE_USD),
      },
    },
  },
};

type BuildSolanaFixtureOptions = {
  showNativeTokenAsMainBalanceDisabled?: boolean;
};

/**
 * Fixture with 50 SOL seeded in AssetsController for unified-assets builds.
 * @param options
 */
export function buildSolanaPositiveBalanceFixture(
  options: BuildSolanaFixtureOptions = {},
) {
  const builder = new FixtureBuilderV2();
  if (options.showNativeTokenAsMainBalanceDisabled) {
    builder.withShowNativeTokenAsMainBalanceDisabled();
  }
  const fixture = builder
    .withAssetsController(SOLANA_NATIVE_ASSETS_CONTROLLER_FIXTURE)
    .build();
  merge(fixture.data, MULTICHAIN_SOL_ASSETS_PATCH);
  return fixture;
}

/**
 * EVM-only Accounts API mocks. Solana balances use SnapDataSource + RPC mocks.
 *
 * @param mockServer
 */
export async function mockAccountsApiV2WithSolana(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockAccountsApiV2EvmOnlySupportedNetworks(mockServer);
}

/**
 * @param mockServer
 */
export async function mockAccountsApiV5WithSolanaNativeBalance(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockAccountsApiV5EvmOnlyBalances(mockServer);
}

/**
 * Token API v3 assets mock for native SOL metadata (unified assets path).
 * @param mockServer
 */
export async function mockSolanaNativeTokenApiAssets(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets.*solana/u)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const assetIdsParam = url.searchParams.getAll('assetIds').join(',');
      const ids = assetIdsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const solanaAsset = {
        assetId: SOL_CAIP_ASSET,
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
        coingeckoId: 'solana',
      };
      const results = ids.includes(SOL_CAIP_ASSET) ? [solanaAsset] : [];
      return { statusCode: 200, json: results };
    });
}

/**
 * Accounts API + token metadata mocks for non-zero Solana balance scenarios.
 * @param mockServer
 */
export async function mockUnifiedSolanaBalanceEndpoints(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockAccountsApiV2WithSolana(mockServer),
    await mockAccountsApiV5WithSolanaNativeBalance(mockServer),
    await mockSolanaNativeTokenApiAssets(mockServer),
  ];
}

/**
 * Whether unified Solana balance mocks should be registered (non-zero balance).
 * @param balanceLamports
 */
export function shouldUseUnifiedSolanaBalanceMocks(
  balanceLamports: number | undefined,
): boolean {
  return balanceLamports === undefined || balanceLamports > 0;
}
