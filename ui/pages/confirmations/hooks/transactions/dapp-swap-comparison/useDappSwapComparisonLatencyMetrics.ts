import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useState } from 'react';

import { useConfirmContext } from '../../../context/confirm';

const N_A = 'N/A';

export function useDappSwapComparisonLatencyMetrics() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const [requestDetectionLatency, setRequestDetectionLatency] = useState(N_A);
  const [quoteRequestLatency, setQuoteRequestLatency] = useState(N_A);
  const [quoteResponseLatency, setQuoteResponseLatency] = useState(N_A);
  const [swapComparisonLatency, setSwapComparisonLatency] = useState(N_A);

  const updateRequestDetectionLatency = useCallback(() => {
    setRequestDetectionLatency(
      (new Date().getTime() - currentConfirmation?.time).toString(),
    );
  }, [currentConfirmation?.time, setRequestDetectionLatency]);

  const updateQuoteRequestLatency = useCallback(() => {
    setQuoteRequestLatency(
      (
        new Date().getTime() -
        currentConfirmation?.time -
        parseInt(requestDetectionLatency, 10)
      ).toString(),
    );
  }, [
    currentConfirmation?.time,
    setQuoteRequestLatency,
    requestDetectionLatency,
  ]);

  const updateQuoteResponseLatency = useCallback(
    (startTime: number) => {
      setQuoteResponseLatency((new Date().getTime() - startTime).toString());
    },
    [setQuoteResponseLatency],
  );

  const updateSwapComparisonLatency = useCallback(() => {
    if (swapComparisonLatency !== N_A) {
      return;
    }
    setSwapComparisonLatency(
      (new Date().getTime() - currentConfirmation?.time).toString(),
    );
  }, [
    currentConfirmation?.time,
    swapComparisonLatency,
    setSwapComparisonLatency,
  ]);

  return {
    requestDetectionLatency,
    quoteRequestLatency,
    quoteResponseLatency,
    swapComparisonLatency,
    updateRequestDetectionLatency,
    updateQuoteRequestLatency,
    updateQuoteResponseLatency,
    updateSwapComparisonLatency,
  };
}
