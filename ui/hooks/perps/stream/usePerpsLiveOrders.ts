import { useEffect, useState, useRef } from 'react';
import { usePerpsController } from '../../../providers/perps';
import type { Order } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveOrders hook
 */
export interface UsePerpsLiveOrdersOptions {
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
}

/**
 * Return type for usePerpsLiveOrders hook
 */
export interface UsePerpsLiveOrdersReturn {
  /** Array of current orders */
  orders: Order[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

// Stable empty array reference to prevent re-renders
const EMPTY_ORDERS: Order[] = [];

/**
 * Hook for real-time order updates via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param options - Configuration options
 * @returns Object containing orders array and loading state
 *
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
  options: UsePerpsLiveOrdersOptions = {},
): UsePerpsLiveOrdersReturn {
  // Note: throttleMs is accepted for API compatibility but not used by controller
  const { throttleMs: _throttleMs = 0 } = options;
  const controller = usePerpsController();
  const [orders, setOrders] = useState<Order[]>(EMPTY_ORDERS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    const unsubscribe = controller.subscribeToOrders({
      callback: (newOrders) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        setOrders(newOrders);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [controller]);

  return { orders, isInitialLoading };
}
