import { useCallback, useRef } from 'react';

const N_A = 'N/A';

export function useDappSwapComparisonLatencyMetrics() {
  const uiInitializedTime = useRef<number>(new Date().getTime());
  const swapComparisonLatency = useRef<number>();

  const updateSwapComparisonLatency = useCallback(() => {
    if (swapComparisonLatency.current !== undefined) {
      return swapComparisonLatency.current.toString();
    }
    swapComparisonLatency.current =
      new Date().getTime() - (uiInitializedTime.current ?? 0);
    return swapComparisonLatency.current.toString();
  }, []);

  return {
    swapComparisonLatency: (swapComparisonLatency.current ?? N_A).toString(),
    updateSwapComparisonLatency,
  };
}
