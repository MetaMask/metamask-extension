/**
 * useMusdGeoBlocking Hook
 *
 * Hook for managing geo-blocking checks for the mUSD conversion feature.
 *
 * Delegates the actual network fetch, TTL caching, and concurrent-request
 * deduplication to the background `GeolocationController`. Multiple hook
 * instances mounting at the same time share a single in-flight request; the
 * controller's service handles that transparently.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectMusdBlockedRegions } from '../../selectors/musd';
import { isGeoBlocked } from '../../components/app/musd/utils';
import { submitRequestToBackground } from '../../store/background-connection';

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
  /** Manually refresh geolocation (bypasses the controller's TTL cache) */
  refreshGeolocation: () => Promise<void>;
};

/**
 * Sentinel value returned by the GeolocationController when the location is
 * not yet determined or the API returned an invalid response.
 */
const UNKNOWN_LOCATION = 'UNKNOWN';

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
   * Request geolocation from the background GeolocationController.
   *
   * The controller (and its underlying API service) handle TTL caching and
   * in-flight request deduplication, so concurrent calls from multiple hook
   * instances collapse into a single network request.
   *
   * @param method - Background API method to invoke. `getGeolocation`
   * respects the controller's cache; `refreshGeolocation` bypasses it.
   * @param options.isCancelled - When this returns true, state updates are
   * skipped (e.g. after the hook unmounts while the request is in flight).
   */
  const fetchGeolocation = useCallback(
    async (
      method: 'getGeolocation' | 'refreshGeolocation',
      options: { isCancelled: () => boolean },
    ): Promise<string | null> => {
      const shouldCommit = () => !options.isCancelled();

      if (!shouldCommit()) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const location = await submitRequestToBackground<string>(method);
        const resolved = location === UNKNOWN_LOCATION ? null : location;
        if (shouldCommit()) {
          setUserCountry(resolved);
        }
        return resolved;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch geolocation';
        if (shouldCommit()) {
          setError(errorMessage);
          setUserCountry(null);
        }
        return null;
      } finally {
        if (shouldCommit()) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // Fetch geolocation on mount. The controller dedupes concurrent callers,
  // so mounting multiple consumers at once only triggers one network request.
  useEffect(() => {
    let cancelled = false;

    fetchGeolocation('getGeolocation', {
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [fetchGeolocation]);

  const refreshGeolocation = useCallback(async (): Promise<void> => {
    await fetchGeolocation('refreshGeolocation', {
      isCancelled: () => false,
    });
  }, [fetchGeolocation]);

  /**
   * Calculate blocking status.
   * While the geolocation fetch is still in progress we report `false` so that
   * consumers don't treat an unknown-yet country as a confirmed block.
   * The fail-closed semantics are preserved: when the fetch *completes* with an
   * error or an UNKNOWN result (userCountry stays `null`, isLoading becomes
   * `false`), isGeoBlocked still returns `true`.
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
    refreshGeolocation,
  };
}

export default useMusdGeoBlocking;
