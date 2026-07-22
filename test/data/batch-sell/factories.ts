import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellAsset } from '../../../ui/ducks/batch-sell/types';
import type {
  SendAssetEntry,
  BatchSellQuotesConfig,
  BatchSellQuotesResults,
} from '../../../ui/pages/batch-sell/pages/review/types';
import { BATCH_SELL_ASSET_IDS, BATCH_SELL_CHAIN_ID } from './constants';
import {
  sumAmounts,
  type DeepPartial,
  type QuoteResponse,
  type selectBatchSellQuotes,
} from '@metamask/bridge-controller';

export function buildBatchSellAsset(
  overrides: Partial<BatchSellAsset> = {},
): BatchSellAsset {
  return {
    assetId: BATCH_SELL_ASSET_IDS.USDC,
    name: 'USD Coin',
    decimals: 6,
    chainId: BATCH_SELL_CHAIN_ID,
    balance: '100',
    iconUrl: 'https://example.com/usdc.png',
    ...overrides,
    symbol: overrides.symbol ?? 'USDC',
  };
}

export function buildSendAssetEntry(
  overrides: DeepPartial<SendAssetEntry> = {},
): SendAssetEntry {
  return {
    assetId: BATCH_SELL_ASSET_IDS.USDC,
    asset: buildBatchSellAsset(),
    sendAmountPercent: 100,
    slippagePercent: 0.5,
    enabled: true,
    ...overrides,
  } as never;
}

/**
 * Returns a BatchSellAsset for use as a receive asset, defaulting to the
 * native ETH token on Ethereum Mainnet.
 *
 * @param overrides - Fields to override on the default asset.
 */
export function buildReceivedAsset(
  overrides: Partial<BatchSellAsset> = {},
): BatchSellAsset {
  return buildBatchSellAsset({
    assetId: BATCH_SELL_ASSET_IDS.ETH_NATIVE,
    symbol: 'ETH',
    ...overrides,
  });
}

export function buildRecommendedQuote(
  overrides: DeepPartial<QuoteResponse['quote']> = {},
) {
  return {
    quote: {
      dest: {
        asset: {
          decimals: 6,
        },
        normalizedAmount: overrides.dest?.normalizedAmount,
        minAmount: overrides.dest?.minAmount,
        minAmountNormalized: overrides.dest?.minAmountNormalized,
        valueInCurrency: overrides.dest?.valueInCurrency,
        minAmountValueInCurrency: overrides.dest?.minAmountValueInCurrency,
        amount: overrides.dest?.amount,
      },
    },
  } as QuoteResponse;
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
  recommendedQuotes: QuoteResponse[] = [],
): ReturnType<typeof selectBatchSellQuotes> {
  const destAmountSum = sumAmounts(recommendedQuotes.map((q) => q.quote?.dest));
  console.log(
    'buildBatchSellControllerResult',
    recommendedQuotes.map((q) => ({
      dest: q.quote?.dest,
    })),
  );

  return {
    recommendedQuotes,
    totalReceived: destAmountSum,
    minimumReceived: {
      asset: destAmountSum?.asset,
      amount: destAmountSum?.minAmount,
      normalizedAmount: destAmountSum?.minAmountNormalized,
      valueInCurrency: destAmountSum?.minAmountValueInCurrency ?? '0',
      usd: destAmountSum?.minAmountValueInCurrency ?? '0',
    },
  } as unknown as ReturnType<typeof selectBatchSellQuotes>;
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
  overrides: Partial<
    BatchSellQuotesConfig['sendAssetsConfig'][CaipAssetType]
  > = {},
): BatchSellQuotesConfig['sendAssetsConfig'][CaipAssetType] {
  return {
    asset: buildBatchSellAsset(),
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
  overrides: Partial<BatchSellQuotesResults['quotes'][CaipAssetType]> = {},
): BatchSellQuotesResults['quotes'][CaipAssetType] {
  return {
    asset: {} as never,
    quote: {} as never,
    hasQuote,
    isLoadingQuote: false,
    ...overrides,
  };
}
