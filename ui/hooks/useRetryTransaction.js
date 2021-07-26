import { useDispatch, useSelector } from 'react-redux';

import { useCallback, useState } from 'react';
import { showSidebar } from '../store/actions';
import { setCustomGasLimit, setCustomGasPrice } from '../ducks/gas/gas.duck';
import { getIsMainnet } from '../selectors';
import { isLegacyTransaction } from '../../shared/modules/transaction.utils';
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
  const { primaryTransaction } = transactionGroup;
  const isMainnet = useSelector(getIsMainnet);

  const hideBasic = !(isMainnet || process.env.IN_TEST);
  const customGasSettings = useIncrementedGasFees(transactionGroup);
  const trackMetricsEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Activity Log',
      name: 'Clicked "Speed Up"',
    },
  });
  const dispatch = useDispatch();
  const [showRetryEditGasPopover, setShowRetryEditGasPopover] = useState(false);

  const closeRetryEditGasPopover = () => setShowRetryEditGasPopover(false);

  const retryTransaction = useCallback(
    async (event) => {
      event.stopPropagation();

      trackMetricsEvent();
      if (process.env.SHOW_EIP_1559_UI) {
        setShowRetryEditGasPopover(true);
      } else {
        if (isLegacyTransaction(primaryTransaction)) {
          // To support the current process of cancelling or speeding up
          // a transaction, we have to inform the custom gas state of the new
          // gasPrice to start at.
          dispatch(setCustomGasPrice(customGasSettings.gasPrice));
          dispatch(setCustomGasLimit(primaryTransaction.txParams.gas));
        }

        dispatch(
          showSidebar({
            transitionName: 'sidebar-left',
            type: 'customize-gas',
            props: { transaction: primaryTransaction, hideBasic },
          }),
        );
      }
    },
    [
      dispatch,
      trackMetricsEvent,
      customGasSettings,
      primaryTransaction,
      hideBasic,
    ],
  );

  return {
    retryTransaction,
    showRetryEditGasPopover,
    closeRetryEditGasPopover,
  };
}
