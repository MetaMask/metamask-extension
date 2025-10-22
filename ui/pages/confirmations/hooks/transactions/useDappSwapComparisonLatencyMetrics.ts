import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useState } from 'react';

import { useConfirmContext } from '../../context/confirm';

export function useDappSwapComparisonLatencyMetrics() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const [requestDetectionLatency, setRequestDetectionLatency] = useState('N/A');
  const [quoteRequestLatency, setQuoteRequestLatency] = useState('N/A');
  const [quoteResponseLatency, setQuoteResponseLatency] = useState('N/A');
  const [swapComparisonLatency, setSwapComparisonLatency] = useState('N/A');

  const updateRequestDetectionLatency = useCallback(() => {
    if (requestDetectionLatency !== 'N/A') {
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
    if (quoteRequestLatency !== 'N/A') {
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
      if (quoteResponseLatency !== 'N/A') {
        return;
      }
      setQuoteResponseLatency((new Date().getTime() - startTime).toString());
    },
    [quoteResponseLatency, setQuoteResponseLatency],
  );

  const updateSwapComparisonLatency = useCallback(() => {
    if (swapComparisonLatency !== 'N/A') {
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
