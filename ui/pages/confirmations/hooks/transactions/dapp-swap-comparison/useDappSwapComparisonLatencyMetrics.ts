import { useCallback, useRef } from 'react';

const N_A = 'N/A';

export function useDappSwapComparisonLatencyMetrics() {
  const uiInitializedTime = useRef<number>(new Date().getTime());
  const requestDetectionLatency = useRef<number>();
  const swapComparisonLatency = useRef<number>();

  const updateRequestDetectionLatency = useCallback(() => {
    if (requestDetectionLatency.current !== undefined) {
      return;
    }
    requestDetectionLatency.current =
      new Date().getTime() - (uiInitializedTime.current ?? 0);
  }, []);

  const updateSwapComparisonLatency = useCallback(() => {
    if (swapComparisonLatency.current !== undefined) {
      return swapComparisonLatency.current.toString();
    }
    swapComparisonLatency.current =
      new Date().getTime() - (uiInitializedTime.current ?? 0);
    return swapComparisonLatency.current.toString();
  }, []);

  return {
    requestDetectionLatency: (
      requestDetectionLatency.current ?? N_A
    ).toString(),
    swapComparisonLatency: (swapComparisonLatency.current ?? N_A).toString(),
    updateRequestDetectionLatency,
    updateSwapComparisonLatency,
  };
}
