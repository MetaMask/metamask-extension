import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useState } from 'react';

import { useConfirmContext } from '../../context/confirm';

const N_A = 'N/A';

export function useDappSwapComparisonLatencyMetrics() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const [requestDetectionLatency, setRequestDetectionLatency] = useState(N_A);
  const [quoteRequestLatency, setQuoteRequestLatency] = useState(N_A);
  const [quoteResponseLatency, setQuoteResponseLatency] = useState(N_A);
  const [swapComparisonLatency, setSwapComparisonLatency] = useState(N_A);

  const updateRequestDetectionLatency = useCallback(() => {
    if (requestDetectionLatency !== N_A) {
      return;
    }
    setRequestDetectionLatency(
      (new Date().getTime() - currentConfirmation?.time).toString(),
    );
  }, [
    currentConfirmation?.time,
    requestDetectionLatency,
    setRequestDetectionLatency,
  ]);

  const updateQuoteRequestLatency = useCallback(() => {
    if (quoteRequestLatency !== N_A) {
      return;
    }
    setQuoteRequestLatency(
      (
        new Date().getTime() -
        currentConfirmation?.time +
        parseInt(requestDetectionLatency, 10)
      ).toString(),
    );
  }, [
    currentConfirmation?.time,
    quoteRequestLatency,
    setQuoteRequestLatency,
    requestDetectionLatency,
  ]);

  const updateQuoteResponseLatency = useCallback(
    (startTime: number) => {
      if (quoteResponseLatency !== N_A) {
        return;
      }
      setQuoteResponseLatency((new Date().getTime() - startTime).toString());
    },
    [quoteResponseLatency, setQuoteResponseLatency],
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
