import { useCallback, useState } from 'react';

const N_A = 'N/A';

export function useDappSwapComparisonLatencyMetrics() {
  const [uiInitializedTime] = useState(() => Date.now());
  const [swapComparisonLatency, setSwapComparisonLatency] = useState<
    number | undefined
  >();

  const updateSwapComparisonLatency = useCallback(() => {
    if (swapComparisonLatency !== undefined) {
      return swapComparisonLatency.toString();
    }
    const latency = Date.now() - uiInitializedTime;
    setSwapComparisonLatency(latency);
    return latency.toString();
  }, [swapComparisonLatency, uiInitializedTime]);

  return {
    swapComparisonLatency: (swapComparisonLatency ?? N_A).toString(),
    updateSwapComparisonLatency,
  };
}
