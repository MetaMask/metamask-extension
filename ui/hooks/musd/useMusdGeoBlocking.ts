/**
 * useMusdGeoBlocking Hook
 *
 * Hook for managing geo-blocking checks for the mUSD conversion feature.
 * Uses the Ramps geolocation API to detect user's country.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectMusdBlockedRegions } from '../../selectors/musd';
import { isGeoBlocked } from '../../../shared/lib/musd';
import { GEOLOCATION_API_ENDPOINT } from '../../../shared/constants/musd';

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

// Cache geolocation result for the session
let cachedGeoLocation: string | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
   * Fetch geolocation from API
   */
  const fetchGeolocation = useCallback(async (): Promise<void> => {
    // Check cache first
    if (
      cachedGeoLocation &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_DURATION_MS
    ) {
      setUserCountry(cachedGeoLocation);
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
      });

      if (!response.ok) {
        throw new Error(`Geolocation API error: ${response.status}`);
      }

      const data: string = await response.text();

      // Cache the result
      cachedGeoLocation = data;
      cacheTimestamp = Date.now();
      console.log('country geo location', data);
      setUserCountry(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch geolocation';
      console.error('[MUSD Geo] Geolocation error:', errorMessage);
      setError(errorMessage);
      // Keep country as null - will result in blocking (fail closed)
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch geolocation on mount
  useEffect(() => {
    fetchGeolocation();
  }, [fetchGeolocation]);

  /**
   * Calculate blocking status
   * Uses region code if available (e.g., "GB-ENG"), falls back to country
   */
  const isBlocked = isGeoBlocked(userCountry, blockedRegions);

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
  cachedGeoLocation = null;
  cacheTimestamp = null;
}

export default useMusdGeoBlocking;
