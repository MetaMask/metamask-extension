import { useDispatch, useSelector } from 'react-redux';

import { useCallback } from 'react';
import { showSidebar } from '../store/actions';
import {
  fetchBasicGasEstimates,
  setCustomGasPriceForRetry,
  setCustomGasLimit,
} from '../ducks/gas/gas.duck';
import { getIsMainnet } from '../selectors';
import { isLegacyTransaction } from '../../shared/modules/transaction.utils';
import { useMetricEvent } from './useMetricEvent';
import { useIncrementedGasFees } from './useIncrementedGasFees';
/**
 * Provides a reusable hook that, given a transactionGroup, will return
 * a method for beginning the retry process
 * @param {Object} transactionGroup - the transaction group
 * @return {Function}
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

  const retryTransaction = useCallback(
    async (event) => {
      event.stopPropagation();

      trackMetricsEvent();
      if (process.env.SHOW_EIP_1559_UI === true) {
        await dispatch(fetchBasicGasEstimates);
      }
      if (isLegacyTransaction(primaryTransaction)) {
        // To support the current process of cancelling or speeding up
        // a transaction, we have to inform the custom gas state of the new
        // gasPrice to start at.
        dispatch(setCustomGasPriceForRetry(customGasSettings.gasPrice));
        dispatch(setCustomGasLimit(primaryTransaction.txParams.gas));
      }

      dispatch(
        showSidebar({
          transitionName: 'sidebar-left',
          type: 'customize-gas',
          props: { transaction: primaryTransaction, hideBasic },
        }),
      );
    },
    [
      dispatch,
      trackMetricsEvent,
      customGasSettings,
      primaryTransaction,
      hideBasic,
    ],
  );

  return retryTransaction;
}
