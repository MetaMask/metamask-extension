import type { OrderFill } from '@metamask/perps-controller';
import type { PerpsStreamManager } from '../../../providers/perps';
import { usePerpsChannel } from './usePerpsChannel';

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

const selectFills = (manager: PerpsStreamManager) => manager.fills;

/**
 * Hook for real-time order fill updates via the PerpsStreamManager fills channel.
 *
 * Fills arrive from the background via subscribeToOrderFills routed through
 * PerpsStreamBridge and pushed to the fills channel.
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
  const { data: fills, isInitialLoading } = usePerpsChannel(selectFills, []);

  return { fills, isInitialLoading };
}
