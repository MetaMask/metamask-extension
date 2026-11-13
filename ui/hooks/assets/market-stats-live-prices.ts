import { useEffect, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import { MarketStatsStore, readLiveQuote, type LivePriceMap } from "@metamask/assets-controller";
import type { CaipAssetType } from "@metamask/utils";
import { getCurrentCurrency } from "../../ducks/metamask/metamask";
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from "../../store/background-connection";

export { readLiveQuote } from "@metamask/assets-controller";

const PRICES_UPDATED_EVENT = "MarketStatsService:pricesUpdated";
const CHAIN_STATUS_EVENT = "MarketStatsService:chainStatusChanged";

const marketStats = new MarketStatsStore();

/**
 * `MessengerSubscriptions` forwards the handler arguments as one array.
 * The published market-stats object is the first argument.
 *
 * @param payload - Notification payload from the background connection.
 * @returns The object passed to `publish`.
 */
function publishedMarketStatsPayload(payload: unknown): unknown {
  return Array.isArray(payload) ? payload[0] : payload;
}

/**
 * @returns The current live prices. Empty until the first tick.
 */
export function getLiveAssetPriceSnapshot(): LivePriceMap {
  return marketStats.getSnapshot();
}

/**
 * Subscribe to live spot prices. The map is replaced when a tick arrives.
 * Each caller registers its own messenger callbacks. `subscribeToMessengerEvent`
 * keeps one background subscription and removes it when the last callback leaves.
 * A subscribe that resolves after its caller unmounted removes only that caller's
 * callbacks.
 *
 * @param onStoreChange - Called after the price map changes.
 * @returns Unsubscribe.
 */
export function subscribeLiveAssetPrices(onStoreChange: () => void): () => void {
  const unsubscribeStore = marketStats.subscribe(onStoreChange);
  let cancelled = false;
  let stop: (() => Promise<void>) | undefined;

  const pricesUpdated = subscribeToMessengerEvent(PRICES_UPDATED_EVENT, (payload) => {
    marketStats.ingestPrices(publishedMarketStatsPayload(payload));
  });
  const chainStatus = subscribeToMessengerEvent(CHAIN_STATUS_EVENT, (payload) => {
    marketStats.ingestChainStatus(publishedMarketStatsPayload(payload));
  });

  Promise.all([pricesUpdated, chainStatus])
    .then((offs) => {
      const release = async () => {
        await Promise.all(offs.map((off) => off()));
      };
      if (cancelled) {
        return release();
      }
      stop = release;
      return undefined;
    })
    .catch(() => undefined);

  return () => {
    unsubscribeStore();
    cancelled = true;
    stop?.().catch(() => undefined);
  };
}

/**
 * Live spot prices from `MarketStatsService:pricesUpdated`.
 * Keys are normalized CAIP-19 ids. Values are prices in the selected currency.
 * Polled prices are read from Redux when an asset has no entry here.
 *
 * @returns Price map. The same reference is returned until a tick changes it.
 */
export function useLiveAssetPrices(): LivePriceMap {
  const currentCurrency = useSelector(getCurrentCurrency) || "usd";
  marketStats.setCurrency(currentCurrency);

  return useSyncExternalStore(
    subscribeLiveAssetPrices,
    marketStats.getSnapshot,
    marketStats.getSnapshot,
  );
}

/**
 * @param assetId - Normalized CAIP-19 asset id.
 * @returns The latest streamed price, or undefined when this asset has no tick yet.
 */
export function useLiveAssetPrice(assetId: string | undefined): number | undefined {
  return readLiveQuote(useLiveAssetPrices(), assetId)?.price;
}

type TokenFiat = {
  balance?: string;
  tokenFiatAmount?: number | null;
  fiat?: {
    balance?: number;
    conversionRate?: number;
    currency?: string;
  };
};

/**
 * Replace a row's fiat balance with `balance * livePrice`.
 * Leaves the row unchanged when there is no tick or the balance is not numeric.
 *
 * `fiat.conversionRate` stays as the list built it. For ERC-20s that field is
 * the native currency's fiat rate, not the token price.
 *
 * @param token - Token row.
 * @param livePrice - Streamed price in the selected currency.
 * @returns The same row, or a copy with an updated fiat balance.
 */
export function applyLiveTokenFiat<TokenRow extends TokenFiat>(
  token: TokenRow,
  livePrice: number | undefined,
): TokenRow {
  if (livePrice === undefined || !Number.isFinite(livePrice)) {
    return token;
  }

  const amount = token.balance === undefined ? Number.NaN : Number(token.balance);
  if (!Number.isFinite(amount)) {
    return token;
  }

  const nextFiat = amount * livePrice;
  if (token.tokenFiatAmount === nextFiat && token.fiat?.balance === nextFiat) {
    return token;
  }

  return {
    ...token,
    tokenFiatAmount: nextFiat,
    ...(token.fiat ? { fiat: { ...token.fiat, balance: nextFiat } } : {}),
  };
}

type PricedAsset = {
  balance?: string;
  fiat?: { balance?: number };
};

/**
 * How much the account total should move when streamed prices replace the
 * polled fiat balances.
 *
 * @param assets - Asset rows that already have a polled fiat balance.
 * @param livePrices - Streamed prices keyed by normalized CAIP-19 id.
 * @param toAssetId - Resolves a row to that key.
 * @returns Sum of `balance * livePrice - previousFiat`.
 */
export function liveFiatDelta<AssetRow extends PricedAsset>(
  assets: AssetRow[],
  livePrices: LivePriceMap,
  toAssetId: (asset: AssetRow) => CaipAssetType | string | undefined,
): number {
  if (livePrices.size === 0) {
    return 0;
  }

  let delta = 0;
  for (const asset of assets) {
    const assetId = toAssetId(asset);
    if (!assetId) {
      continue;
    }
    const livePrice = readLiveQuote(livePrices, assetId)?.price;
    const previous = asset.fiat?.balance;
    if (livePrice === undefined || previous === undefined || !Number.isFinite(previous)) {
      continue;
    }
    const amount = asset.balance === undefined ? Number.NaN : Number(asset.balance);
    if (!Number.isFinite(amount)) {
      continue;
    }
    delta += amount * livePrice - previous;
  }
  return delta;
}

const NO_LIVE_ADJUSTMENTS: ReadonlyMap<string, number> = new Map();

/**
 * Live price adjustment for each account group's polled fiat total.
 * Groups with no streamed quote are omitted, so their polled total stays.
 *
 * @param assetsByGroup - Asset rows keyed by account group, then chain.
 * @param livePrices - Streamed prices keyed by normalized CAIP-19 id.
 * @param toAssetId - Resolves a row to that key.
 * @returns Deltas to add to each group's polled total.
 */
export function liveGroupFiatAdjustments<AssetRow extends PricedAsset>(
  assetsByGroup: Readonly<
    Record<string, Readonly<Record<string, readonly AssetRow[]>> | undefined>
  >,
  livePrices: LivePriceMap,
  toAssetId: (asset: AssetRow) => CaipAssetType | string | undefined,
): ReadonlyMap<string, number> {
  if (livePrices.size === 0) {
    return NO_LIVE_ADJUSTMENTS;
  }

  const adjustments = new Map<string, number>();
  for (const [groupId, assetsByChain] of Object.entries(assetsByGroup)) {
    if (!assetsByChain) {
      continue;
    }
    const assets: AssetRow[] = [];
    for (const chainAssets of Object.values(assetsByChain)) {
      if (chainAssets) {
        assets.push(...chainAssets);
      }
    }
    const delta = liveFiatDelta(assets, livePrices, toAssetId);
    if (delta !== 0) {
      adjustments.set(groupId, delta);
    }
  }
  return adjustments;
}

/**
 * Watch one CAIP-19 price while a screen is mounted, including an asset the
 * account does not track. Tracked assets already stream from the balance
 * pipeline. This opens `MarketStatsService` directly.
 *
 * @param assetId - CAIP-19 asset id. Nothing is watched when it is missing.
 */
function unsubscribeMarketStats(assetId: string, currency: string): void {
  submitRequestToBackground("messengerCall", [
    "MarketStatsService:unsubscribe",
    [{ assetId, currency }],
  ]).catch(() => undefined);
}

export function useWatchAssetPrice(assetId: string | undefined): void {
  const currentCurrency = useSelector(getCurrentCurrency) || "usd";
  marketStats.setCurrency(currentCurrency);

  useEffect(() => {
    if (!assetId) {
      return undefined;
    }

    let cancelled = false;
    let subscribed = false;

    submitRequestToBackground("messengerCall", [
      "MarketStatsService:subscribe",
      [{ assetId, currency: currentCurrency }],
    ])
      .then(() => {
        subscribed = true;
        if (cancelled) {
          unsubscribeMarketStats(assetId, currentCurrency);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (subscribed) {
        unsubscribeMarketStats(assetId, currentCurrency);
      }
    };
  }, [assetId, currentCurrency]);
}
