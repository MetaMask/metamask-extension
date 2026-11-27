import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  marketStatsQueryKey,
  quotesFor,
  shareMarketStatsData,
  subscribeLiveQuotes,
  type LivePriceMap,
  type MarketStatsQuoteHandlers,
} from '@metamask/core-backend';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../../store/background-connection';

export {
  applyLiveTokenFiat,
  liveFiatDelta,
  liveGroupFiatAdjustments,
  readLiveQuotes,
} from '@metamask/core-backend';

const PRICES_UPDATED_EVENT = 'MarketStatsService:pricesUpdated';

function useSelectedCurrency(): string {
  return useSelector(getCurrentCurrency) || 'usd';
}

/**
 * The background connection resolves its unsubscribe after it accepts the
 * subscription. `subscribeLiveQuotes` releases that unsubscribe when it
 * arrives after the caller has already stopped.
 *
 * @param handlers - Quote-map callbacks from `subscribeLiveQuotes`.
 * @returns Unsubscribe, once the messenger subscription resolves.
 */
function subscribeExtension(
  handlers: MarketStatsQuoteHandlers,
): Promise<() => Promise<void>> {
  return subscribeToMessengerEvent(
    PRICES_UPDATED_EVENT,
    handlers.onPricesUpdated,
  ).then((off) => async () => {
    await off();
  });
}

/** Wait before subscribing so a setup that is discarded immediately never sends one. */
const SUBSCRIBE_DEBOUNCE_MS = 500;

/** The open screen subscribes as this caller. */
const UI_CALLER = 'ui';

function subscribeMarketStats(
  subscriptions: { assetId: string; currency: string }[],
): void {
  // `messengerCall` spreads its second argument into the service method.
  // The caller has to sit inside that list. A third argument is dropped, and
  // a one-asset list then arrives as `options` with `caller` undefined.
  submitRequestToBackground('messengerCall', [
    'MarketStatsService:subscribe',
    [subscriptions, UI_CALLER],
  ]).catch(() => undefined);
}

/**
 * Open these assets' market-stats channels while the screen is mounted.
 * The price poll may already hold the same channels. This screen subscribes
 * as `ui`, and leaving it sends an empty list for that caller.
 *
 * The subscribe waits so a setup React discards never sends one.
 *
 * Pass a memoized list. A new array each render resubscribes each render.
 *
 * @param assetIds - CAIP-19 asset ids. An empty list opens nothing.
 */
export function useMarketStatsSubscription(assetIds: readonly string[]): void {
  const currentCurrency = useSelectedCurrency();

  useEffect(() => {
    if (assetIds.length === 0) {
      return undefined;
    }

    let sent = false;
    const timer = setTimeout(() => {
      sent = true;
      subscribeMarketStats(
        assetIds.map((assetId) => ({ assetId, currency: currentCurrency })),
      );
    }, SUBSCRIBE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      if (sent) {
        subscribeMarketStats([]);
      }
    };
  }, [assetIds, currentCurrency]);
}

/**
 * Listen for market-stats ticks and write them into the query cache.
 * Mount this once, through `MarketStatsBridge`. `useMarketStats` only reads
 * the cache, so readers never add a listener of their own.
 */
export function useMarketStatsListener(): void {
  const currentCurrency = useSelectedCurrency();
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeLiveQuotes({
        queryClient,
        currency: currentCurrency,
        subscribe: subscribeExtension,
      }),
    [currentCurrency, queryClient],
  );
}

/**
 * Read the live quote map from the query cache.
 * Pass `select` with `readLiveQuotes` for the assets this reader shows.
 * A tick that does not change those quotes keeps the previous list.
 * With no `select`, the whole map is returned.
 *
 * This only reads. `MarketStatsBridge` writes the ticks.
 *
 * @param select - Slice of the quote map this reader needs.
 * @returns The selected slice, or the quote map.
 */
export function useMarketStats<Selected = LivePriceMap>(
  select?: (quotes: LivePriceMap) => Selected,
): Selected {
  const currentCurrency = useSelectedCurrency();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => marketStatsQueryKey(currentCurrency),
    [currentCurrency],
  );

  const { data } = useQuery({
    queryKey,
    // Ticks are written into the cache. This query never fetches.
    queryFn: skipToken,
    initialData: () => quotesFor(queryClient, currentCurrency),
    staleTime: Infinity,
    // Ticks arrive with no reader mounted. Keep the map for the next one.
    gcTime: Infinity,
    // The snapshot is a Map. Default sharing only walks plain objects.
    structuralSharing: shareMarketStatsData,
    select,
  });

  // `initialData` always seeds the query, so `data` is set.
  return data as Selected;
}
