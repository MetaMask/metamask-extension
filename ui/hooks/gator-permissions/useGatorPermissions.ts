import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAndUpdateGatorPermissions } from '../../store/controller-actions/gator-permissions-controller';
import { AppState } from '../../selectors/gator-permissions/gator-permissions';

export type UseGatorPermissionsOptions = {
  /**
   * Whether to refresh data in the background after returning cached data.
   * Default: true
   */
  refreshInBackground?: boolean;
};

export type UseGatorPermissionsResult = {
  /**
   * True only on initial load when no cached data exists.
   * False when cached data is available, even if refreshing.
   */
  loading: boolean;
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

  // identify whether any gator permissions exist in the gator cache
  const hasCachedPermissions = useSelector(
    (state: AppState) => state.metamask.grantedPermissions?.length > 0,
  );

  // Only show loading on initial load when no cache exists
  const [loading, setLoading] = useState(!hasCachedPermissions);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchGatorPermissions = async () => {
      try {
        if (!hasCachedPermissions) {
          setLoading(true);
        }

        // Note: We don't need to manually update state here because:
        // 1. fetchAndUpdateGatorPermissions updates the controller state
        // 2. Controller state automatically syncs to Redux
        // 3. The selector will pick up the new data and trigger re-render
        await fetchAndUpdateGatorPermissions();
      } catch (err) {
        // ignore errors - we will retry this request
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Skip fetch if we have cached data and background refresh is disabled
    if (hasCachedPermissions && !refreshInBackground) {
      setLoading(false);
    } else if (!hasFetchedRef.current) {
      // Only fetch once on mount
      fetchGatorPermissions()
        .then(() => {
          // Mark as fetched only after successful fetch
          hasFetchedRef.current = true;
        })
        .catch(() => {
          // Don't set the flag on failure, allowing retries
        });
    }

    return () => {
      cancelled = true;
    };
    // Note: cachedData is intentionally excluded from dependencies to prevent infinite loop
    // when fetchAndUpdateGatorPermissions updates the Redux store
  }, [dispatch, hasCachedPermissions, refreshInBackground]);

  return {
    loading,
  };
}
