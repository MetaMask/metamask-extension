import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';

/**
 * Read the background-preloaded market data from Redux.
 *
 * The controller stores market data under `${provider}:${network}` keys
 * (e.g. `hyperliquid:mainnet`).  The existing `selectPerpsCachedMarketData`
 * selector uses the bare provider name, so it never finds the data. This
 * inline selector builds the correct composite key.
 *
 * @param state - The Redux state slice
 * @param state.metamask - The MetaMask state
 * @param state.metamask.activeProvider - Active perps provider id (e.g. `hyperliquid`)
 * @param state.metamask.isTestnet - Whether the provider is using testnet
 * @param state.metamask.cachedMarketDataByProvider - Market data keyed by `provider:network`
 * @returns The cached market data array, or null if not found
 */
function selectCachedMarketDataWithCorrectKey(state: {
  metamask?: {
    activeProvider?: string;
    isTestnet?: boolean;
    cachedMarketDataByProvider?: Record<
      string,
      { data?: PerpsMarketData[]; timestamp?: number }
    >;
  };
}): PerpsMarketData[] | null {
  const provider = state.metamask?.activeProvider ?? 'hyperliquid';
  const isTestnet = state.metamask?.isTestnet ?? false;
  const key = `${provider}:${isTestnet ? 'testnet' : 'mainnet'}`;
  return state.metamask?.cachedMarketDataByProvider?.[key]?.data ?? null;
}

/**
 * Sync background-preloaded market data into the PerpsStreamManager.
 *
 * The PerpsController's background preloader fetches market data on startup
 * and re-fetches whenever `hip3ConfigVersion` changes (e.g., when the HIP-3
 * allowlist arrives from LaunchDarkly). The preloaded data is stored in
 * `cachedMarketDataByProvider` in Redux.
 *
 * The stream manager's `markets` channel makes its own one-time REST fetch,
 * but has no mechanism to receive updates from the background preloader.
 * If the initial fetch happened before the HIP-3 config was available,
 * HIP-3 markets will be missing or show `$---` indefinitely.
 *
 * This hook bridges the gap: when Redux market data updates (from the
 * background preloader), it pushes that data into the stream manager's
 * markets channel, ensuring all subscribers get fresh data.
 *
 * Mount once in PerpsLayout alongside usePerpsPrewarm.
 */
export function usePerpsMarketDataSync(): void {
  const cachedMarkets = useSelector(selectCachedMarketDataWithCorrectKey);
  const streamManager = getPerpsStreamManager();

  // Track the last reference we pushed to avoid redundant pushes.
  const lastPushedRef = useRef<PerpsMarketData[] | null>(null);

  useEffect(() => {
    // Same reference as last push — nothing to do
    if (cachedMarkets === lastPushedRef.current) {
      return;
    }

    if (!cachedMarkets || cachedMarkets.length === 0) {
      return;
    }

    if (!streamManager.isInitialized()) {
      return;
    }

    // Only push if the preloaded data is at least as complete as the current
    // stream cache.  This prevents a stale preload from overwriting a fresh
    // REST response that already has better data.
    const currentMarkets = streamManager.markets.getCachedData();
    if (currentMarkets.length > cachedMarkets.length) {
      return;
    }

    lastPushedRef.current = cachedMarkets;
    streamManager.markets.pushData(cachedMarkets);
  }, [cachedMarkets, streamManager]);
}
