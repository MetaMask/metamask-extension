import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import log from 'loglevel';
import {
  getChainSupportsSmartTransactions,
  getSmartTransactionsPreferenceEnabled,
} from '../../../../shared/modules/selectors';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import {
  fetchSmartTransactionsLiveness,
  setSwapsFeatureFlags,
  setSmartTransactionsRefreshInterval,
} from '../../../store/actions';
import { useUnapprovedTransaction } from './transactions/useUnapprovedTransaction';

export function useSmartTransactionFeatureFlags() {
  const dispatch = useDispatch();
  const currentConfirmation = useUnapprovedTransaction();
  const {
    id: transactionId,
    txParams,
    networkClientId,
  } = currentConfirmation ?? {};
  const isTransaction = Boolean(txParams);

  const smartTransactionsPreferenceEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );

  const currentChainSupportsSmartTransactions = useSelector(
    getChainSupportsSmartTransactions,
  );

  useEffect(() => {
    if (
      !isTransaction ||
      !transactionId ||
      !smartTransactionsPreferenceEnabled ||
      !currentChainSupportsSmartTransactions
    ) {
      return;
    }

    Promise.all([
      fetchSwapsFeatureFlags(),
      fetchSmartTransactionsLiveness({ networkClientId })(),
    ])
      .then(([swapsFeatureFlags]) => {
        dispatch(setSwapsFeatureFlags(swapsFeatureFlags));
        dispatch(
          setSmartTransactionsRefreshInterval(
            swapsFeatureFlags.smartTransactions?.batchStatusPollingInterval,
          ),
        );
      })
      .catch((error) => {
        log.debug('Error updating smart transaction feature flags', error);
      });
  }, [
    isTransaction,
    transactionId,
    smartTransactionsPreferenceEnabled,
    currentChainSupportsSmartTransactions,
    networkClientId,
  ]);
}
