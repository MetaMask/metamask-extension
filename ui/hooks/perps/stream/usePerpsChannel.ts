import { useEffect, useState, useRef } from 'react';
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
 * @param emptyValue - The empty/default value when no data is available
 * @returns Object containing data and loading state
 */
export function usePerpsChannel<TData>(
  getChannel: (sm: PerpsStreamManager) => PerpsDataChannel<TData>,
  emptyValue: TData,
): UsePerpsChannelReturn<TData> {
  const { streamManager, isInitializing } = usePerpsStreamManager();

  // Initialize state from cache if available (synchronous)
  const [data, setData] = useState<TData>(() => {
    if (streamManager) {
      return getChannel(streamManager).getCachedData();
    }
    return emptyValue;
  });

  // Track whether we've received real data
  const hasReceivedData = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (streamManager) {
      const channel = getChannel(streamManager);
      if (channel.hasCachedData()) {
        hasReceivedData.current = true;
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    if (isInitializing || !streamManager) {
      return;
    }

    const channel = getChannel(streamManager);

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
