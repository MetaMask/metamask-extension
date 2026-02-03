import { useEffect, useState, useRef } from 'react';
import { usePerpsController } from '../../../providers/perps';
import type { OrderFill } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveFills hook
 */
export interface UsePerpsLiveFillsOptions {
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
}

/**
 * Return type for usePerpsLiveFills hook
 */
export interface UsePerpsLiveFillsReturn {
  /** Array of order fills (most recent first) */
  fills: OrderFill[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

// Stable empty array reference to prevent re-renders
const EMPTY_FILLS: OrderFill[] = [];

/**
 * Hook for real-time order fill updates via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param options - Configuration options
 * @returns Object containing fills array and loading state
 *
 * @example
 * ```tsx
 * function RecentFills() {
 *   const { fills, isInitialLoading } = usePerpsLiveFills();
 *
 *   if (isInitialLoading) return <Spinner />;
 *
 *   return (
 *     <ul>
 *       {fills.slice(0, 10).map((fill) => (
 *         <li key={fill.orderId}>
 *           {fill.symbol}: {fill.side} {fill.size} @ {fill.price}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePerpsLiveFills(
  options: UsePerpsLiveFillsOptions = {},
): UsePerpsLiveFillsReturn {
  // Note: throttleMs is accepted for API compatibility but not used by controller
  const { throttleMs: _throttleMs = 0 } = options;
  const controller = usePerpsController();
  const [fills, setFills] = useState<OrderFill[]>(EMPTY_FILLS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    const unsubscribe = controller.subscribeToOrderFills({
      callback: (newFills) => {
        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        setFills(newFills);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [controller]);

  return { fills, isInitialLoading };
}
