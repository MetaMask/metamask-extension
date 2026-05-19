import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import type {
  PerpsDataChannel,
  PerpsStreamManager,
} from '../../../providers/perps';
import { usePerpsStreamManager } from './usePerpsStreamManager';

/**
 * Return type for usePerpsChannel hook
 */
export type UsePerpsChannelReturn<TData> = {
  /** The current data */
  data: TData;
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

/**
 * Generic hook for subscribing to a PerpsStreamManager channel.
 *
 * Handles the common pattern of:
 * - Reading cached data synchronously on mount
 * - Subscribing to live updates
 * - Tracking initial loading state
 * - Cleaning up subscriptions on unmount
 *
 * @param getChannel - Function to get the channel from the stream manager
 * @param emptyValue - The empty/default value when no data is available (use a stable reference, e.g. module-level constant — not an inline `[]`/`{}` literal)
 * @param resetKey - When this value changes (e.g. order book symbol), the channel cache is cleared and loading state resets so stale data is not shown while new data streams in.
 * @returns Object containing data and loading state
 */
export function usePerpsChannel<TData>(
  getChannel: (sm: PerpsStreamManager) => PerpsDataChannel<TData>,
  emptyValue: TData,
  resetKey?: string | number,
): UsePerpsChannelReturn<TData> {
  const { streamManager, isInitializing } = usePerpsStreamManager();

  const getChannelRef = useRef(getChannel);
  getChannelRef.current = getChannel;

  const emptyValueRef = useRef(emptyValue);
  emptyValueRef.current = emptyValue;

  const prevResetKeyRef = useRef<string | number | undefined>(undefined);

  // Initialize state from cache if available (synchronous)
  const [data, setData] = useState<TData>(() => {
    if (streamManager) {
      return getChannelRef.current(streamManager).getCachedData();
    }
    return emptyValue;
  });

  // Track whether we've received real data
  const hasReceivedData = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (streamManager) {
      const channel = getChannelRef.current(streamManager);
      if (channel.hasCachedData()) {
        hasReceivedData.current = true;
        return false;
      }
    }
    return true;
  });

  useLayoutEffect(() => {
    if (resetKey === undefined || !streamManager) {
      return;
    }
    const prev = prevResetKeyRef.current;
    if (prev !== undefined && prev !== resetKey) {
      getChannelRef.current(streamManager).clearCache();
      hasReceivedData.current = false;
      setData(emptyValueRef.current);
      setIsInitialLoading(true);
    }
    prevResetKeyRef.current = resetKey;
  }, [resetKey, streamManager]);

  useEffect(() => {
    if (isInitializing || !streamManager) {
      return;
    }

    const channel = getChannelRef.current(streamManager);

    // Deliver cached data immediately
    if (channel.hasCachedData()) {
      setData(channel.getCachedData());
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }
    }

    // Subscribe for live updates
    const unsubscribe = channel.subscribe((newData) => {
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }
      setData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, [streamManager, isInitializing]);

  if (!streamManager || isInitializing) {
    return { data: emptyValue, isInitialLoading: true };
  }

  return { data, isInitialLoading };
}
