/**
 * useCanBuyMusd Hook
 *
 * Single source of truth for whether the user can buy mUSD in their region.
 * Composes geo-blocking and ramp token availability (per-chain) so callers
 * don't need to assemble these conditions themselves.
 */

import { useState, useEffect, useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import {
  MUSD_BUYABLE_CHAIN_IDS,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
} from '../../components/app/musd/constants';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';

// ============================================================================
// Token Cache API
// ============================================================================

export type RampToken = {
  assetId?: string;
  tokenSupported?: boolean;
};

const isProdEnv = process.env.NODE_ENV === 'production';
const PROD_TOKEN_CACHE_BASE_URL = 'https://on-ramp-cache.api.cx.metamask.io';
const UAT_TOKEN_CACHE_BASE_URL = 'https://on-ramp-cache.uat-api.cx.metamask.io';

const tokenCacheBaseUrl = isProdEnv
  ? PROD_TOKEN_CACHE_BASE_URL
  : UAT_TOKEN_CACHE_BASE_URL;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const regionTokenCache = {
  country: null as string | null,
  tokens: [] as RampToken[],
  timestamp: null as number | null,
};

/**
 * Fetches the token list from the on-ramp token cache API for a given country.
 * Results are cached for 5 minutes.
 *
 * @param country - the country to fetch the token list for
 * @returns the token list for the given country
 * @throws if fetching the token list from the token cache API returns an error
 */
export async function fetchRegionTokens(country: string): Promise<RampToken[]> {
  if (
    regionTokenCache.country === country &&
    regionTokenCache.timestamp &&
    Date.now() - regionTokenCache.timestamp < CACHE_DURATION_MS
  ) {
    return regionTokenCache.tokens;
  }

  try {
    const url = new URL(
      `/regions/${country.toLowerCase()}/tokens`,
      tokenCacheBaseUrl,
    );
    url.searchParams.set('action', 'buy');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Token cache API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      allTokens?: RampToken[];
    };

    const tokens: RampToken[] = data.allTokens ?? [];

    regionTokenCache.country = country;
    regionTokenCache.tokens = tokens;
    regionTokenCache.timestamp = Date.now();

    return tokens;
  } catch {
    return [];
  }
}

export function clearRegionTokenCache(): void {
  regionTokenCache.country = null;
  regionTokenCache.tokens = [];
  regionTokenCache.timestamp = null;
}

// ============================================================================
// Hook
// ============================================================================

export type UseCanBuyMusdResult = {
  /** Whether the user can buy mUSD given geo-blocking and current network selection */
  canBuyMusdInRegion: boolean;
  /** Per-chain mUSD buyability based on ramp token list */
  isMusdBuyableOnChain: Record<Hex, boolean>;
  /** Whether mUSD is buyable on any supported chain */
  isMusdBuyableOnAnyChain: boolean;
  /** Whether mUSD is buyable given the current network filter (selected chain or popular networks) */
  isMusdBuyable: boolean;
  /** Whether any async check is still in progress */
  isLoading: boolean;
};

/**
 * Determines whether the current user can buy mUSD.
 *
 * The user can buy when both conditions are met:
 * 1. They are not in a geo-blocked region.
 * 2. mUSD is available via ramp on at least one supported chain
 * (verified against the token cache API using CAIP-19 asset IDs).
 */
export function useCanBuyMusd(): UseCanBuyMusdResult {
  const {
    isBlocked,
    isLoading: geoIsLoading,
    userCountry,
  } = useMusdGeoBlocking();
  const { selectedChainId, isPopularNetworksFilterActive } =
    useMusdNetworkFilter();

  const [rampTokens, setRampTokens] = useState<RampToken[]>([]);
  const [rampIsLoading, setRampIsLoading] = useState(true);

  useEffect(() => {
    if (!userCountry) {
      setRampTokens([]);
      setRampIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setRampIsLoading(true);

    fetchRegionTokens(userCountry).then((tokens) => {
      if (!cancelled) {
        setRampTokens(tokens);
        setRampIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userCountry]);

  const isMusdBuyableOnChain = useMemo(() => {
    const buyableByChain: Record<Hex, boolean> = {};

    for (const chainId of MUSD_BUYABLE_CHAIN_IDS) {
      const musdAssetId = MUSD_TOKEN_ASSET_ID_BY_CHAIN[chainId];
      if (!musdAssetId) {
        buyableByChain[chainId] = false;
        continue;
      }

      buyableByChain[chainId] = rampTokens.some(
        (token) =>
          token.assetId?.toLowerCase() === musdAssetId.toLowerCase() &&
          token.tokenSupported === true,
      );
    }

    return buyableByChain;
  }, [rampTokens]);

  const isMusdBuyableOnAnyChain = useMemo(
    () => Object.values(isMusdBuyableOnChain).some(Boolean),
    [isMusdBuyableOnChain],
  );

  // Resolve buyability against the current network filter state
  const isMusdBuyable = useMemo(() => {
    if (isPopularNetworksFilterActive) {
      return isMusdBuyableOnAnyChain;
    }
    if (selectedChainId) {
      return isMusdBuyableOnChain[selectedChainId] ?? false;
    }
    return false;
  }, [
    isPopularNetworksFilterActive,
    selectedChainId,
    isMusdBuyableOnChain,
    isMusdBuyableOnAnyChain,
  ]);

  return {
    canBuyMusdInRegion: !isBlocked && isMusdBuyable,
    isMusdBuyableOnChain,
    isMusdBuyableOnAnyChain,
    isMusdBuyable,
    isLoading: geoIsLoading || rampIsLoading,
  };
}

export default useCanBuyMusd;
