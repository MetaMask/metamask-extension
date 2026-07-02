import { merge } from 'lodash';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';

/** Solana account id used in default multichain fixtures. */
export const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';

export const SOL_CAIP_ASSET =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

export const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

/** Matches `mockPriceApiSpotPrice` in common-solana (50 SOL → $5,643.50). */
export const SOL_SPOT_PRICE_USD = 112.87;

export const SOL_BALANCE_HUMAN = '50';

const SOLANA_POSITIVE_BALANCE_ASSETS_CONTROLLER = {
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
 * Zero-balance cases use the default fixture + Solana RPC mocks instead.
 *
 * @param options
 */
export function buildSolanaPositiveBalanceFixture(
  options: BuildSolanaFixtureOptions = {},
) {
  let builder = new FixtureBuilderV2().withEnabledNetworks({
    eip155: {
      '0x539': true,
    },
    solana: {
      [SOLANA_CHAIN_ID]: true,
    },
  });

  if (options.showNativeTokenAsMainBalanceDisabled) {
    builder = builder.withShowNativeTokenAsMainBalanceDisabled();
  }

  return merge(
    builder
      .withAssetsController(SOLANA_POSITIVE_BALANCE_ASSETS_CONTROLLER)
      .build(),
    MULTICHAIN_SOL_ASSETS_PATCH,
  );
}
