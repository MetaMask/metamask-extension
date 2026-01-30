import { useEffect, useState, useRef } from 'react';
import { usePerpsStream } from '../../../providers/perps';
import type { Position } from '../../../../app/scripts/controllers/perps/types';

/**
 * Options for usePerpsLivePositions hook
 */
export interface UsePerpsLivePositionsOptions {
  /** Throttle delay in milliseconds (default: 0 - no throttling for instant updates) */
  throttleMs?: number;
}

/**
 * Return type for usePerpsLivePositions hook
 */
export interface UsePerpsLivePositionsReturn {
  /** Array of current positions */
  positions: Position[];
  /** Whether we're waiting for the first real data */
  isInitialLoading: boolean;
}

// Stable empty array reference to prevent re-renders
const EMPTY_POSITIONS: Position[] = [];

/**
 * Hook for real-time position updates via stream subscription
 *
 * @param options - Configuration options
 * @returns Object containing positions array and loading state
 *
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
  options: UsePerpsLivePositionsOptions = {},
): UsePerpsLivePositionsReturn {
  const { throttleMs = 0 } = options;
  const stream = usePerpsStream();
  const [positions, setPositions] = useState<Position[]>(EMPTY_POSITIONS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasReceivedFirstUpdate = useRef(false);

  useEffect(() => {
    const unsubscribe = stream.positions.subscribe({
      callback: (newPositions) => {
        if (newPositions === null) {
          return;
        }

        if (!hasReceivedFirstUpdate.current) {
          hasReceivedFirstUpdate.current = true;
          setIsInitialLoading(false);
        }

        setPositions(newPositions);
      },
      throttleMs,
    });

    return () => {
      unsubscribe();
    };
  }, [stream, throttleMs]);

  return { positions, isInitialLoading };
}
