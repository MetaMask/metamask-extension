import { useEffect, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { CaipAssetType } from "@metamask/utils";
import { getCurrentCurrency } from "../../ducks/metamask/metamask";
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from "../../store/background-connection";

const PRICE_CHANGED_EVENT = "AssetsController:priceChanged";
const PRICES_UPDATED_EVENT = "MarketStatsService:pricesUpdated";

type LiveQuote = {
  price: number;
  pricePercentChange1d?: number;
};

type LivePriceMap = ReadonlyMap<string, LiveQuote>;

let quotes = new Map<string, LiveQuote>();
let snapshot: LivePriceMap = quotes;
const listeners = new Set<() => void>();

let messengerConsumers = 0;
let stopMessenger: (() => Promise<void>) | undefined;
let messengerStart: Promise<void> | undefined;
// Bumped when the last listener leaves, so a subscribe that resolves after
// that unmount cannot detach the listener a later mount just registered.
let subscriptionGeneration = 0;

/**
 * Asset ids this UI subscribed on `MarketStatsService` directly. Ticks for
 * these ids are not published by AssetsController.
 */
const directWatches = new Set<string>();

/** Currency passed to the open direct subscriptions. */
let watchCurrency = "usd";

/**
 * Store a spot price under the id the token list looks up.
 * EVM ids are lowercased, matching `normalizeTokenAssetId`.
 *
 * @param assetId - CAIP-19 asset id from a price batch.
 * @returns Lookup key.
 */
function storageKey(assetId: string): string {
  return assetId.startsWith("eip155:") ? assetId.toLowerCase() : assetId;
}

function emit(): void {
  snapshot = quotes;
  for (const listener of listeners) {
    listener();
  }
}

function readFiniteNumber(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

/**
 * Merge one `AssetsController:priceChanged` payload into the live price map.
 * The background forwards the messenger arguments, so the payload is either
 * `[{ prices }]` or `{ prices }`.
 *
 * @param payload - Event payload from the background connection.
 */
export function ingestPriceChanged(payload: unknown): void {
  const batch = Array.isArray(payload) ? payload[0] : payload;
  if (!batch || typeof batch !== "object" || !("prices" in batch)) {
    return;
  }

  const nextPrices = (
    batch as {
      prices?: Record<string, { price?: number | string; pricePercentChange1d?: number | string }>;
    }
  ).prices;
  if (!nextPrices) {
    return;
  }

  let changed = false;
  const updated = new Map(quotes);
  for (const [assetId, entry] of Object.entries(nextPrices)) {
    const price = readFiniteNumber(entry?.price);
    if (price === undefined) {
      continue;
    }
    const pricePercentChange1d = readFiniteNumber(entry?.pricePercentChange1d);
    const key = storageKey(assetId);
    const previous = updated.get(key);
    if (previous?.price === price && previous.pricePercentChange1d === pricePercentChange1d) {
      continue;
    }
    updated.set(
      key,
      pricePercentChange1d === undefined ? { price } : { price, pricePercentChange1d },
    );
    changed = true;
  }

  if (!changed) {
    return;
  }

  quotes = updated;
  emit();
}

type MarketStatsUpdate = {
  assetId?: string;
  currency?: string;
  price?: number | string;
  pricePercentChange1d?: number | string | null;
};

/**
 * Merge a `MarketStatsService:pricesUpdated` batch into the live price map.
 * The socket only sends assets something subscribed to: tracked assets from
 * AssetsController, and any asset this UI subscribed directly. Entries in
 * another currency are ignored.
 *
 * @param payload - Event payload from the background connection.
 * @param currency - Selected currency.
 */
export function ingestMarketStatsPrices(payload: unknown, currency: string): void {
  const batch = Array.isArray(payload) ? payload[0] : payload;
  if (!batch || typeof batch !== "object" || !("updates" in batch)) {
    return;
  }

  const updates = (batch as { updates?: MarketStatsUpdate[] }).updates;
  if (!Array.isArray(updates)) {
    return;
  }

  const wanted = currency.toLowerCase();
  const prices: Record<
    string,
    { price?: number | string; pricePercentChange1d?: number | string }
  > = {};
  for (const update of updates) {
    if (!update?.assetId || update.currency?.toLowerCase() !== wanted) {
      continue;
    }
    prices[update.assetId] = {
      price: update.price,
      ...(typeof update.pricePercentChange1d === "number" ||
      typeof update.pricePercentChange1d === "string"
        ? { pricePercentChange1d: update.pricePercentChange1d }
        : {}),
    };
  }

  if (Object.keys(prices).length === 0) {
    return;
  }

  ingestPriceChanged({ prices });
}

function startMessengerSubscription(): void {
  const generation = subscriptionGeneration;
  const priceChanged = subscribeToMessengerEvent(PRICE_CHANGED_EVENT, (payload) => {
    ingestPriceChanged(payload);
  });
  const pricesUpdated = subscribeToMessengerEvent(PRICES_UPDATED_EVENT, (payload) => {
    ingestMarketStatsPrices(payload, watchCurrency);
  });

  messengerStart = Promise.all([priceChanged, pricesUpdated])
    .then((offs) => {
      const stop = async () => {
        await Promise.all(offs.map((off) => off()));
      };
      if (generation !== subscriptionGeneration || messengerConsumers === 0) {
        if (generation === subscriptionGeneration) {
          messengerStart = undefined;
        }
        return stop();
      }
      messengerStart = undefined;
      stopMessenger = stop;
      return undefined;
    })
    .catch(() => {
      // The background connection can reject the first subscribe. A later
      // mount tries again instead of leaving the UI on the polled price.
      if (generation === subscriptionGeneration) {
        messengerStart = undefined;
      }
    });
}

function retainMessengerSubscription(): () => void {
  messengerConsumers += 1;
  if (!stopMessenger && !messengerStart) {
    startMessengerSubscription();
  }

  return () => {
    messengerConsumers -= 1;
    if (messengerConsumers > 0) {
      return;
    }
    subscriptionGeneration += 1;
    const stop = stopMessenger;
    stopMessenger = undefined;
    messengerStart = undefined;
    stop?.().catch(() => undefined);
  };
}

/**
 * Subscribe to live spot prices. The map is replaced when a tick arrives.
 *
 * @param onStoreChange - Called after the price map changes.
 * @returns Unsubscribe.
 */
export function subscribeLiveAssetPrices(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const releaseMessenger = retainMessengerSubscription();
  return () => {
    listeners.delete(onStoreChange);
    releaseMessenger();
  };
}

/**
 * @returns The current live prices. Empty until the first tick.
 */
export function getLiveAssetPriceSnapshot(): LivePriceMap {
  return snapshot;
}

/**
 * Live spot prices published by `AssetsController:priceChanged`.
 * Keys are normalized CAIP-19 ids. Values are prices in the selected currency.
 *
 * @returns Price map. The same reference is returned until a tick changes it.
 */
export function useLiveAssetPrices(): LivePriceMap {
  const currency = useSelector(getCurrentCurrency);
  useEffect(() => {
    if (typeof currency === "string" && currency.length > 0) {
      watchCurrency = currency;
    }
  }, [currency]);

  return useSyncExternalStore(
    subscribeLiveAssetPrices,
    getLiveAssetPriceSnapshot,
    getLiveAssetPriceSnapshot,
  );
}

/**
 * @param assetId - Normalized CAIP-19 asset id.
 * @returns The latest streamed price, or undefined when this asset has no tick yet.
 */
/**
 * Quote for one asset. The id is normalized the same way ticks are stored.
 *
 * @param livePrices - Current quote map.
 * @param assetId - CAIP-19 asset id, checksummed or not.
 * @returns The streamed quote, or undefined.
 */
export function readLiveQuote(
  livePrices: LivePriceMap,
  assetId: string | undefined,
): LiveQuote | undefined {
  if (!assetId) {
    return undefined;
  }
  return livePrices.get(storageKey(assetId));
}

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

/**
 * Watch one CAIP-19 price while a screen is mounted, including an asset the
 * account does not track. Tracked assets already stream from the balance
 * pipeline. This opens `MarketStatsService` directly and does not go through
 * AssetsController.
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
  const currency = useSelector(getCurrentCurrency);

  useEffect(() => {
    if (!assetId || typeof currency !== "string" || currency.length === 0) {
      return undefined;
    }

    const key = storageKey(assetId);
    directWatches.add(key);
    watchCurrency = currency;

    let cancelled = false;
    let subscribed = false;

    submitRequestToBackground("messengerCall", [
      "MarketStatsService:subscribe",
      [{ assetId, currency }],
    ])
      .then(() => {
        subscribed = true;
        if (cancelled) {
          unsubscribeMarketStats(assetId, currency);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      directWatches.delete(key);
      if (subscribed) {
        unsubscribeMarketStats(assetId, currency);
      }
    };
  }, [assetId, currency]);
}
