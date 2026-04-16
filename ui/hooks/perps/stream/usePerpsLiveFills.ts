import { useEffect, useState, useRef } from 'react';
import { usePerpsController } from '../../../providers/perps';
import type { OrderFill } from '@metamask/perps-controller';

/**
 * Options for usePerpsLiveFills hook
 */
export type UsePerpsLiveFillsOptions = {
  /** Throttle delay in milliseconds (default: 0 - no throttling) */
  throttleMs?: number;
};

/**
 * Return type for usePerpsLiveFills hook
 */
export type UsePerpsLiveFillsReturn = {
  /** Array of order fills (most recent first) */
  fills: OrderFill[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

// Stable empty array reference to prevent re-renders
const EMPTY_FILLS: OrderFill[] = [];

/**
 * Hook for real-time order fill updates via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param _options - Configuration options (unused, for API compatibility)
 * @returns Object containing fills array and loading state
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLiveFillsOptions = {},
): UsePerpsLiveFillsReturn {
  const controller = usePerpsController();
  const [fills, setFills] = useState<OrderFill[]>(EMPTY_FILLS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    // Reset state when controller changes (account switch)
    setFills(EMPTY_FILLS);
    setIsInitialLoading(true);
    hasReceivedFirstUpdate.current = false;

    const unsubscribe = controller.subscribeToOrderFills({
      callback: (newFills: OrderFill[]) => {
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
