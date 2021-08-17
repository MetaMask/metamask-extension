import { useCallback, useState } from 'react';
import { useMetricEvent } from './useMetricEvent';
import { useIncrementedGasFees } from './useIncrementedGasFees';

/**
 * @typedef {Object} RetryTransactionReturnValue
 * @property {(event: Event) => void} retryTransaction - open edit gas popover
 *  to begin setting retry gas fees
 * @property {boolean} showRetryEditGasPopover - Whether to show the popover
 * @property {() => void} closeRetryEditGasPopover - close the popover.
 */

/**
 * Provides a reusable hook that, given a transactionGroup, will return
 * a method for beginning the retry process
 * @param {Object} transactionGroup - the transaction group
 * @return {RetryTransactionReturnValue}
 */

export function useRetryTransaction(transactionGroup) {
  const customRetryGasSettings = useIncrementedGasFees(transactionGroup);
  const trackMetricsEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Activity Log',
      name: 'Clicked "Speed Up"',
    },
  });
  const [showRetryEditGasPopover, setShowRetryEditGasPopover] = useState(false);

  const closeRetryEditGasPopover = () => setShowRetryEditGasPopover(false);

  const retryTransaction = useCallback(
    async (event) => {
      event.stopPropagation();
      setShowRetryEditGasPopover(true);
      trackMetricsEvent();
    },
    [trackMetricsEvent],
  );

  return {
    retryTransaction,
    showRetryEditGasPopover,
    closeRetryEditGasPopover,
    customRetryGasSettings,
  };
}
