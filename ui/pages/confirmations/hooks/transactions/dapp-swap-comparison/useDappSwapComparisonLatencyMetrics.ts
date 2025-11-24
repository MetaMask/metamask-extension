import { useCallback, useMemo, useRef } from 'react';

const N_A = 'N/A';

export function useDappSwapComparisonLatencyMetrics() {
  const uiInitializedTime = useRef<number>(0);
  const requestDetectionLatency = useRef(0);
  const swapComparisonLatency = useRef(0);

  // using useMemo here as it is the first hook to be executed
  useMemo(() => {
    uiInitializedTime.current = new Date().getTime();
  }, []);

  const updateRequestDetectionLatency = useCallback(() => {
    if (requestDetectionLatency.current) {
      return;
    }
    requestDetectionLatency.current =
      new Date().getTime() - uiInitializedTime.current;
  }, []);

  const updateSwapComparisonLatency = useCallback(() => {
    if (swapComparisonLatency.current) {
      return swapComparisonLatency.current.toString();
    }
    swapComparisonLatency.current =
      new Date().getTime() - uiInitializedTime.current;
    return swapComparisonLatency.current.toString();
  }, []);

  return {
    requestDetectionLatency: (
      requestDetectionLatency.current || N_A
    ).toString(),
    swapComparisonLatency: (swapComparisonLatency.current || N_A).toString(),
    updateRequestDetectionLatency,
    updateSwapComparisonLatency,
  };
}
