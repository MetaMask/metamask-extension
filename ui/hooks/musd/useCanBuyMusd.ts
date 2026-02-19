/**
 * useCanBuyMusd Hook
 *
 * Single source of truth for whether the user can buy mUSD in their region.
 * Composes geo-blocking, network buyability, and ramp region availability
 * checks so callers don't need to assemble these conditions themselves.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';
import { MUSD_BUYABLE_CHAIN_IDS } from '../../components/app/musd/constants';

// ============================================================================
// Token Cache API
// ============================================================================

const isProdEnv = process.env.NODE_ENV === 'production';
const PROD_TOKEN_CACHE_BASE_URL = 'https://on-ramp-cache.api.cx.metamask.io';
const UAT_TOKEN_CACHE_BASE_URL =
  'https://on-ramp-cache.uat-api.cx.metamask.io';

const tokenCacheBaseUrl = isProdEnv
  ? PROD_TOKEN_CACHE_BASE_URL
  : UAT_TOKEN_CACHE_BASE_URL;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const regionTokenCache = {
  country: null as string | null,
  hasTokens: false,
  timestamp: null as number | null,
};

/**
 * Checks the on-ramp token cache API to determine whether ramp buying
 * is available in the given country. Results are cached for 5 minutes.
 *
 * Fail closed: returns false on any error or empty response.
 */
export async function fetchRegionBuySupport(
  country: string,
): Promise<boolean> {
  if (
    regionTokenCache.country === country &&
    regionTokenCache.timestamp &&
    Date.now() - regionTokenCache.timestamp < CACHE_DURATION_MS
  ) {
    return regionTokenCache.hasTokens;
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
      topTokens?: unknown[];
      allTokens?: unknown[];
    };

    const hasTokens =
      (data.topTokens?.length ?? 0) > 0 ||
      (data.allTokens?.length ?? 0) > 0;

    regionTokenCache.country = country;
    regionTokenCache.hasTokens = hasTokens;
    regionTokenCache.timestamp = Date.now();

    return hasTokens;
  } catch {
    regionTokenCache.country = country;
    regionTokenCache.hasTokens = false;
    regionTokenCache.timestamp = Date.now();
    return false;
  }
}

export function clearRegionTokenCache(): void {
  regionTokenCache.country = null;
  regionTokenCache.hasTokens = false;
  regionTokenCache.timestamp = null;
}

// ============================================================================
// Hook
// ============================================================================

export type UseCanBuyMusdResult = {
  /** Whether the user can buy mUSD (not geo-blocked, buyable chain enabled, and ramps available in region) */
  canBuyMusdInRegion: boolean;
  /** Whether any async check is still in progress */
  isLoading: boolean;
};

/**
 * Determines whether the current user can buy mUSD.
 *
 * The user can buy when all conditions are met:
 * 1. They are not in a geo-blocked region.
 * 2. At least one of their enabled chains supports mUSD buy routes.
 * 3. The ramps aggregator serves their country (token cache API returns tokens).
 */
export function useCanBuyMusd(): UseCanBuyMusdResult {
  const { isBlocked, isLoading: geoIsLoading, userCountry } =
    useMusdGeoBlocking();
  const { enabledChainIds } = useMusdNetworkFilter();

  const [isRampBuyAvailable, setIsRampBuyAvailable] = useState(false);
  const [rampIsLoading, setRampIsLoading] = useState(true);

  const checkRampRegion = useCallback(async (country: string) => {
    setRampIsLoading(true);
    const available = await fetchRegionBuySupport(country);
    setIsRampBuyAvailable(available);
    setRampIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userCountry) {
      setIsRampBuyAvailable(false);
      setRampIsLoading(false);
      return;
    }
    checkRampRegion(userCountry);
  }, [userCountry, checkRampRegion]);

  const isMusdBuyableOnAnyEnabledChain = useMemo(
    () =>
      enabledChainIds.some((chainId) =>
        MUSD_BUYABLE_CHAIN_IDS.includes(chainId),
      ),
    [enabledChainIds],
  );

  return {
    canBuyMusdInRegion:
      !isBlocked && isMusdBuyableOnAnyEnabledChain && isRampBuyAvailable,
    isLoading: geoIsLoading || rampIsLoading,
  };
}

export default useCanBuyMusd;
