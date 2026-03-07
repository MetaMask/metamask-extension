/**
 * useMusdGeoBlocking Hook
 *
 * Hook for managing geo-blocking checks for the mUSD conversion feature.
 * Uses the Ramps geolocation API to detect user's country.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectMusdBlockedRegions } from '../../selectors/musd';
import { isGeoBlocked } from '../../components/app/musd/utils';
import { GEOLOCATION_API_ENDPOINT } from '../../components/app/musd/constants';

// ============================================================================
// Types
// ============================================================================

export type UseMusdGeoBlockingResult = {
  /** Whether the user is blocked from using mUSD conversion */
  isBlocked: boolean;
  /** User's detected country code */
  userCountry: string | null;
  /** Whether geolocation check is in progress */
  isLoading: boolean;
  /** Error message if geolocation failed */
  error: string | null;
  /** Blocked countries/regions list */
  blockedRegions: string[];
  /** Message to display if blocked */
  blockedMessage: string | null;
  /** Manually refresh geolocation */
  refreshGeolocation: () => Promise<void>;
};

// ============================================================================
// Cache
// ============================================================================

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const geoLocationCache = {
  location: null as string | null,
  timestamp: null as number | null,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for geo-blocking checks
 *
 * IMPORTANT: Returns isBlocked=true by default when country is unknown
 * for compliance safety (fail closed).
 */
export function useMusdGeoBlocking(): UseMusdGeoBlockingResult {
  const blockedRegions = useSelector(selectMusdBlockedRegions);

  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch geolocation from API.
   *
   * Accepts an optional AbortSignal so the caller (e.g. a useEffect cleanup)
   * can cancel an in-flight request when the component unmounts.
   */
  const fetchGeolocation = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      // Check cache first
      if (
        geoLocationCache.location &&
        geoLocationCache.timestamp &&
        Date.now() - geoLocationCache.timestamp < CACHE_DURATION_MS
      ) {
        setUserCountry(geoLocationCache.location);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(GEOLOCATION_API_ENDPOINT, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`Geolocation API error: ${response.status}`);
        }

        const data: string = await response.text();

        geoLocationCache.location = data;
        geoLocationCache.timestamp = Date.now();
        setUserCountry(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch geolocation';
        console.error('[MUSD Geo] Geolocation error:', errorMessage);
        setError(errorMessage);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // Fetch geolocation on mount; abort on unmount
  useEffect(() => {
    const controller = new AbortController();
    fetchGeolocation(controller.signal);
    return () => controller.abort();
  }, [fetchGeolocation]);

  /**
   * Calculate blocking status.
   * While the geolocation fetch is still in progress we report `false` so that
   * consumers don't treat an unknown-yet country as a confirmed block.
   * The fail-closed semantics are preserved: when the fetch *completes* with an
   * error (userCountry stays `null`, isLoading becomes `false`), isGeoBlocked
   * still returns `true`.
   */
  const isBlocked = !isLoading && isGeoBlocked(userCountry, blockedRegions);

  /**
   * Generate blocked message
   */
  const blockedMessage = isBlocked
    ? 'mUSD conversion is not available in your region.'
    : null;

  return {
    isBlocked,
    userCountry,
    isLoading,
    error,
    blockedRegions,
    blockedMessage,
    refreshGeolocation: fetchGeolocation,
  };
}

/**
 * Clear the geolocation cache
 * Useful for testing or when user changes network/VPN
 */
export function clearGeoLocationCache(): void {
  geoLocationCache.location = null;
  geoLocationCache.timestamp = null;
}

export default useMusdGeoBlocking;
