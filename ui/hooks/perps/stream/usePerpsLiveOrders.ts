import { usePerpsChannel } from './usePerpsChannel';
import type { Order } from '@metamask/perps-controller';

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
 */
export function usePerpsLiveOrders(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLiveOrdersOptions = {},
): UsePerpsLiveOrdersReturn {
  const { data: orders, isInitialLoading } = usePerpsChannel(
    (sm) => sm.orders,
    EMPTY_ORDERS,
  );

  return { orders, isInitialLoading };
}
