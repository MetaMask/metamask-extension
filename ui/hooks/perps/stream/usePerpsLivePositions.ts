import { useEffect, useState, useRef } from 'react';
import type { Position } from '@metamask/perps-controller';
import { usePerpsController } from '../../../providers/perps';

/**
 * Options for usePerpsLivePositions hook
 */
export type UsePerpsLivePositionsOptions = {
  /** Throttle delay in milliseconds (default: 0 - no throttling for instant updates) */
  throttleMs?: number;
};

/**
 * Return type for usePerpsLivePositions hook
 */
export type UsePerpsLivePositionsReturn = {
  /** Array of current positions */
  positions: Position[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
};

// Stable empty array reference to prevent re-renders
const EMPTY_POSITIONS: Position[] = [];

/**
 * Hook for real-time position updates via stream subscription
 *
 * Uses the PerpsController directly for WebSocket subscriptions.
 *
 * @param _options - Configuration options (unused, for API compatibility)
 * @returns Object containing positions array and loading state
 * @example
 * ```tsx
 * function PositionsList() {
 *   const { positions, isInitialLoading } = usePerpsLivePositions();
 *
 *   if (isInitialLoading) return <Spinner />;
 *
 *   return (
 *     <ul>
 *       {positions.map((pos) => (
 *         <li key={pos.symbol}>
 *           {pos.symbol}: {pos.size} @ {pos.entryPrice}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePerpsLivePositions(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: UsePerpsLivePositionsOptions = {},
): UsePerpsLivePositionsReturn {
  const controller = usePerpsController();
  const [positions, setPositions] = useState<Position[]>(EMPTY_POSITIONS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    const unsubscribe = controller.subscribeToPositions({
      callback: (newPositions) => {
        // Debug: Log all positions received from controller
        console.log(
          '[Perps] Positions received:',
          newPositions.length,
          newPositions.map((p) => ({
            symbol: p.symbol,
            size: p.size,
            positionValue: p.positionValue,
          })),
        );

        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        setPositions(newPositions);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [controller]);

  return { positions, isInitialLoading };
}
