import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { forceUpdateMetamaskState } from '../store/actions';

const STALE_THRESHOLD_MS = 60_000; // 60 seconds (conservative)
const CHECK_INTERVAL_MS = 10_000; // 10 seconds (reduced overhead)

/**
 * Hook that detects stale state sync and auto-recovers by forcing a state refresh.
 *
 * This is a P2 guardrail that provides a safety net for cases where the UI sync
 * state gets stuck. With the P0 fix (maxWait debounce) in place, this should rarely
 * trigger, but provides defense-in-depth for edge cases.
 *
 * The hook starts a periodic check only while `isSyncing` is true, minimising
 * runtime overhead. If a sync operation remains in progress for longer than
 * `STALE_THRESHOLD_MS` (60 s) the hook calls `forceUpdateMetamaskState` to
 * flush any pending patches and reset the timer.
 *
 * @param isSyncing - Whether a sync operation is currently in progress.
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const isSyncing = useSelector(selectIsSyncing);
 *   useStateSyncHealth(isSyncing);
 *   return <div />;
 * };
 * ```
 */
export function useStateSyncHealth(isSyncing: boolean): void {
  const dispatch = useDispatch();
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);

  // Track when syncing started / stopped
  useEffect(() => {
    if (isSyncing) {
      setSyncStartTime((prev) => prev ?? Date.now());
    } else {
      setSyncStartTime(null);
    }
  }, [isSyncing]);

  // Periodically check whether the sync has been stuck
  useEffect(() => {
    if (!isSyncing || syncStartTime === null) {
      return undefined;
    }

    const checkStale = async () => {
      const elapsed = Date.now() - syncStartTime;
      if (elapsed > STALE_THRESHOLD_MS) {
        console.warn('Stale state sync detected, triggering recovery', {
          elapsed,
        });
        await forceUpdateMetamaskState(dispatch);
        setSyncStartTime(null);
      }
    };

    const interval = setInterval(checkStale, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isSyncing, syncStartTime, dispatch]);
}
