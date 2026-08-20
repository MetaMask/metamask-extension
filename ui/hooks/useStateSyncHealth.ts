import { useEffect, useRef } from 'react';
import { forceUpdateMetamaskState } from '../store/actions';
import { useDispatch } from '../store/hooks';

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
  const syncStartTimeRef = useRef<number | null>(null);
  const isRecoveringRef = useRef(false);

  // Track when syncing started / stopped without triggering re-renders
  useEffect(() => {
    if (isSyncing) {
      syncStartTimeRef.current = Date.now();
    } else {
      syncStartTimeRef.current = null;
    }
  }, [isSyncing]);

  // Periodically check whether the sync has been stuck
  useEffect(() => {
    if (!isSyncing) {
      return undefined;
    }

    const checkStale = async () => {
      // Skip if a recovery is already in progress to prevent concurrent calls
      if (isRecoveringRef.current || syncStartTimeRef.current === null) {
        return;
      }

      const elapsed = Date.now() - syncStartTimeRef.current;
      if (elapsed > STALE_THRESHOLD_MS) {
        console.warn('Stale state sync detected, triggering recovery', {
          elapsed,
        });
        isRecoveringRef.current = true;
        try {
          await forceUpdateMetamaskState(dispatch);
          // Reset so the interval stops checking until isSyncing toggles again.
          // forceUpdateMetamaskState should update state, causing isSyncing to
          // become false. If it stays true the caller can re-mount the hook.
          syncStartTimeRef.current = null;
        } finally {
          isRecoveringRef.current = false;
        }
      }
    };

    const interval = setInterval(checkStale, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isSyncing, dispatch]);
}
