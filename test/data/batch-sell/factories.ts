import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellAsset } from '../../../ui/ducks/batch-sell/types';
import type {
  SendAssetEntry,
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
} from '../../../ui/pages/batch-sell/pages/review/types';
import { BATCH_SELL_ASSET_IDS, BATCH_SELL_CHAIN_ID } from './constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOverrides = Record<string, any>;

export function buildBatchSellAsset(
  overrides: AnyOverrides = {},
): BatchSellAsset {
  return {
    assetId: BATCH_SELL_ASSET_IDS.USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: BATCH_SELL_CHAIN_ID,
    balance: '100',
    iconUrl: 'https://example.com/usdc.png',
    ...overrides,
  } as unknown as BatchSellAsset;
}

export function buildSendAssetEntry(
  overrides: AnyOverrides = {},
): SendAssetEntry {
  return {
    assetId: BATCH_SELL_ASSET_IDS.USDC,
    asset: buildBatchSellAsset(),
    sendAmountPercent: 100,
    slippagePercent: 0.5,
    enabled: true,
    ...overrides,
  } as SendAssetEntry;
}

/**
 * Returns a BatchSellAsset for use as a receive asset, defaulting to the
 * native ETH token on Ethereum Mainnet.
 *
 * @param overrides - Fields to override on the default asset.
 */
export function buildReceivedAsset(
  overrides: AnyOverrides = {},
): BatchSellAsset {
  return buildBatchSellAsset({
    assetId: BATCH_SELL_ASSET_IDS.ETH_NATIVE,
    symbol: 'ETH',
    ...overrides,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildRecommendedQuote(overrides: AnyOverrides = {}): any {
  return {
    toTokenAmount: { amount: 10, valueInCurrency: 100 },
    minToTokenAmount: { amount: 9 },
    ...overrides,
  };
}

/**
 * Wraps an array of recommended quotes inside the minimal controller-result
 * shape expected by `buildResults` and related utilities. Mirrors the bridge
 * controller by pre-aggregating `totalReceived` and `minimumReceived` across
 * the provided quotes so consumers can read the sums directly.
 *
 * @param recommendedQuotes - Array of recommended quote objects.
 */
export function buildBatchSellControllerResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendedQuotes: any[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const sum = (key: string, field: string): string =>
    String(
      recommendedQuotes.reduce(
        (acc, quote) => acc + (Number(quote?.[key]?.[field]) || 0),
        0,
      ),
    );

  return {
    recommendedQuotes,
    totalReceived: {
      amount: sum('toTokenAmount', 'amount'),
      valueInCurrency: sum('toTokenAmount', 'valueInCurrency'),
      usd: null,
    },
    minimumReceived: {
      amount: sum('minToTokenAmount', 'amount'),
      valueInCurrency: sum('minToTokenAmount', 'valueInCurrency'),
      usd: null,
    },
  } as never;
}

/**
 * Returns a single entry for `BatchSellQuotesConfig['sendAssetsConfig']` (i.e.
 * the map *value*, keyed by asset ID).  The `enabled` flag is required; all
 * other fields default to sensible values.
 *
 * @param enabled - Whether the asset is enabled for selling.
 * @param overrides - Fields to override on the default config entry.
 */
export function buildSendAssetConfigEntry(
  enabled: boolean,
  overrides: AnyOverrides = {},
): BatchSellQuotesConfig['sendAssetsConfig'][CaipAssetType] {
  return {
    asset: buildBatchSellAsset() as never,
    sendAmountPercent: 100,
    slippagePercent: 0.5,
    enabled,
    ...overrides,
  };
}

/**
 * Returns a single entry for `BatchSellQuotesResults['quotes']`.
 * The `hasQuote` flag is required; asset and quote default to empty stubs.
 *
 * @param hasQuote - Whether a quote is available for this asset.
 * @param overrides - Fields to override on the default quote entry.
 */
export function buildQuoteEntry(
  hasQuote: boolean,
  overrides: AnyOverrides = {},
): BatchSellQuotesResults['quotes'][CaipAssetType] {
  return {
    asset: {} as never,
    quote: {} as never,
    hasQuote,
    isLoadingQuote: false,
    ...overrides,
  };
}
