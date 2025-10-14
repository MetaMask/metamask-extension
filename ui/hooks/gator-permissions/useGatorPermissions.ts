import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
import { fetchAndUpdateGatorPermissions } from '../../store/controller-actions/gator-permissions-controller';
import {
  getGatorPermissionsMap,
  AppState,
} from '../../selectors/gator-permissions/gator-permissions';

export type UseGatorPermissionsOptions = {
  /**
   * Whether to refresh data in the background after returning cached data.
   * Default: true
   */
  refreshInBackground?: boolean;
};

export type UseGatorPermissionsResult = {
  /**
   * The gator permissions data. Returns cached data immediately if available.
   */
  data: GatorPermissionsMap | undefined;
  /**
   * Error that occurred during fetch, if any.
   */
  error: Error | undefined;
  /**
   * True only on initial load when no cached data exists.
   * False when cached data is available, even if refreshing.
   */
  loading: boolean;
  /**
   * True when fetching fresh data in the background while cached data is shown.
   */
  isRefreshing: boolean;
};

/**
 * Hook to get gator permissions with cache-first strategy.
 * Returns cached data immediately if available, then optionally refreshes in background.
 *
 * @param options - Configuration options for the hook
 * @returns Gator permissions data, loading states, and error
 */
export function useGatorPermissions(
  options: UseGatorPermissionsOptions = {},
): UseGatorPermissionsResult {
  const { refreshInBackground = true } = options;
  const dispatch = useDispatch();

  // Get cached data from Redux immediately
  const cachedData = useSelector((state: AppState) =>
    getGatorPermissionsMap(state),
  );

  // Only show loading on initial load when no cache exists
  const [loading, setLoading] = useState<boolean>(!cachedData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchGatorPermissions = async () => {
      try {
        setError(undefined);

        // If we have cached data, this is a background refresh
        if (cachedData) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        await fetchAndUpdateGatorPermissions();
        // Note: We don't need to manually update state here because:
        // 1. fetchAndUpdateGatorPermissions updates the controller state
        // 2. Controller state automatically syncs to Redux
        // 3. The selector will pick up the new data and trigger re-render
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    // Skip fetch if we have cached data and background refresh is disabled
    if (cachedData && !refreshInBackground) {
      setLoading(false);
    } else {
      fetchGatorPermissions();
    }

    return () => {
      cancelled = true;
    };
  }, [dispatch, cachedData, refreshInBackground]);

  return {
    data: cachedData,
    error,
    loading,
    isRefreshing,
  };
}
