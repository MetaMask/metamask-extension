import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { showSidebar } from '../store/actions';
import {
  fetchBasicGasEstimates,
  setCustomGasPriceForRetry,
  setCustomGasLimit,
} from '../ducks/gas/gas.duck';
import { increaseLastGasPrice } from '../helpers/utils/confirm-tx.util';
import { useMetricEvent } from './useMetricEvent';

/**
 * Provides a reusable hook that, given a transactionGroup, will return
 * a method for beginning the retry process
 * @param {Object} transactionGroup - the transaction group
 * @return {Function}
 */
export function useRetryTransaction(transactionGroup) {
  const { primaryTransaction } = transactionGroup;
  // Signature requests do not have a txParams, but this hook is called indiscriminately
  const gasPrice = primaryTransaction.txParams?.gasPrice;
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
      await dispatch(fetchBasicGasEstimates);
      const transaction = primaryTransaction;
      const increasedGasPrice = increaseLastGasPrice(gasPrice);
      await dispatch(
        setCustomGasPriceForRetry(
          increasedGasPrice || transaction.txParams.gasPrice,
        ),
      );
      dispatch(setCustomGasLimit(transaction.txParams.gas));
      dispatch(
        showSidebar({
          transitionName: 'sidebar-left',
          type: 'customize-gas',
          props: { transaction },
        }),
      );
    },
    [dispatch, trackMetricsEvent, gasPrice, primaryTransaction],
  );

  return retryTransaction;
}
