import { useEffect, useState, useRef } from 'react';
import type { Order } from '@metamask/perps-controller';
import { usePerpsStreamManager } from './usePerpsStreamManager';

/**
 * Options for usePerpsLiveOrders hook
 */
export type UsePerpsLiveOrdersOptions = {
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
};

/**
 * Return type for usePerpsLiveOrders hook
 */
export type UsePerpsLiveOrdersReturn = {
  /** Array of current orders */
  orders: Order[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

// Stable empty array reference to prevent re-renders
const EMPTY_ORDERS: Order[] = [];

/**
 * Hook for real-time order updates via stream subscription
 *
 * Uses the PerpsStreamManager for cached, BehaviorSubject-like access.
 * Cached data is delivered immediately on subscribe, eliminating loading
 * skeletons when navigating between Perps views.
 *
 * @param _options - Configuration options (unused, for API compatibility)
 * @returns Object containing orders array and loading state
 * @example
 * ```tsx
 * function OrdersList() {
 *   const { orders, isInitialLoading } = usePerpsLiveOrders();
 *
 *   if (isInitialLoading) return <Spinner />;
 *
 *   const openOrders = orders.filter(o => o.status === 'open');
 *
 *   return (
 *     <ul>
 *       {openOrders.map((order) => (
 *         <li key={order.orderId}>
 *           {order.symbol}: {order.side} {order.size} @ {order.price}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePerpsLiveOrders(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLiveOrdersOptions = {},
): UsePerpsLiveOrdersReturn {
  const { streamManager, isInitializing } = usePerpsStreamManager();

  // Initialize state from cache if available (synchronous)
  const [orders, setOrders] = useState<Order[]>(() => {
    if (streamManager) {
      return streamManager.orders.getCachedData();
    }
    return EMPTY_ORDERS;
  });

  // Track whether we've received real data
  const hasReceivedData = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (streamManager?.orders.hasCachedData()) {
      hasReceivedData.current = true;
      return false;
    }
    return true;
  });

  useEffect(() => {
    // If still initializing stream manager, stay in loading state
    if (isInitializing || !streamManager) {
      return;
    }

    // Check if we have cached data immediately
    if (streamManager.orders.hasCachedData()) {
      const cached = streamManager.orders.getCachedData();
      setOrders(cached);
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }
    }

    // Subscribe - callback fires immediately with cached data (if any)
    const unsubscribe = streamManager.orders.subscribe((newOrders) => {
      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setIsInitialLoading(false);
      }

      setOrders(newOrders);
    });

    return () => {
      unsubscribe();
    };
  }, [streamManager, isInitializing]);

  // If stream manager isn't ready yet, show loading
  if (!streamManager || isInitializing) {
    return { orders: EMPTY_ORDERS, isInitialLoading: true };
  }

  return { orders, isInitialLoading };
}
