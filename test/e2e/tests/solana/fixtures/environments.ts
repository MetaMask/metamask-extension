import { merge } from 'lodash';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  LAMPORTS_PER_SOL,
  SOL,
  SOL_ACCOUNT_ID,
  SOL_BALANCE_HUMAN,
  SOL_CAIP_ASSET,
  SOLANA_CHAIN_ID,
  SOL_SPOT_PRICE_USD,
  USDC,
  USDC_BALANCE_HUMAN,
  USDC_CAIP_ASSET,
  USDC_SPOT_PRICE_USD,
  USDC_SWAP_SPOT_PRICE_USD,
} from './tokens';

/** Default fixture wallet used across Solana E2E specs. */
export const SOLANA_WALLET_ADDRESS =
  '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';

/**
 * Recipient address for send flows.
 * Disclaimer: This account is intended solely for testing purposes.
 */
export const SOLANA_RECIPIENT_ADDRESS =
  '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c';

/** @deprecated Use `SOLANA_RECIPIENT_ADDRESS`. */
export const commonSolanaAddress = SOLANA_RECIPIENT_ADDRESS;

const SOLANA_POSITIVE_BALANCE_ASSETS_CONTROLLER = {
  assetsBalance: {
    [SOL_ACCOUNT_ID]: {
      [SOL_CAIP_ASSET]: {
        amount: SOL_BALANCE_HUMAN,
      },
    },
  },
  assetsInfo: {
    [SOL_CAIP_ASSET]: SOL,
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

const SOLANA_SOL_USDC_ASSETS_CONTROLLER = {
  assetsBalance: {
    [SOL_ACCOUNT_ID]: {
      [SOL_CAIP_ASSET]: {
        amount: SOL_BALANCE_HUMAN,
      },
      [USDC_CAIP_ASSET]: {
        amount: USDC_BALANCE_HUMAN,
      },
    },
  },
  assetsInfo: {
    [SOL_CAIP_ASSET]: SOL,
    [USDC_CAIP_ASSET]: USDC,
  },
  assetsPrice: {
    [SOL_CAIP_ASSET]: {
      assetPriceType: 'fungible' as const,
      id: 'solana',
      lastUpdated: 0,
      price: SOL_SWAP_SPOT_PRICE_USD,
      usdPrice: SOL_SWAP_SPOT_PRICE_USD,
    },
    [USDC_CAIP_ASSET]: {
      assetPriceType: 'fungible' as const,
      id: 'usd-coin',
      lastUpdated: 0,
      price: USDC_SPOT_PRICE_USD,
      usdPrice: USDC_SPOT_PRICE_USD,
    },
  },
};

const MULTICHAIN_SOL_USDC_ASSETS_PATCH = {
  MultichainAssetsController: {
    accountsAssets: {
      [SOL_ACCOUNT_ID]: [SOL_CAIP_ASSET, USDC_CAIP_ASSET],
    },
  },
  MultichainRatesController: {
    conversionRates: {
      [SOL_CAIP_ASSET]: {
        conversionTime: 1770832998.066,
        rate: String(SOL_SWAP_SPOT_PRICE_USD),
      },
      [USDC_CAIP_ASSET]: {
        conversionTime: 1770832998.066,
        rate: String(USDC_SPOT_PRICE_USD),
      },
    },
  },
};

export const SOLANA_LOCAL_NODE_POSITIVE_BALANCE_OPTIONS = {
  initialBalances: {
    [SOLANA_WALLET_ADDRESS]: 50 * LAMPORTS_PER_SOL,
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

/**
 * Fixture with 50 SOL and USDC portfolio for SPL send / swap specs.
 * @param options
 */
export function buildSolanaSolUsdcPortfolioFixture(
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
    builder.withAssetsController(SOLANA_SOL_USDC_ASSETS_CONTROLLER).build(),
    MULTICHAIN_SOL_USDC_ASSETS_PATCH,
  );
}
