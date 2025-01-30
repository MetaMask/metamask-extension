import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  getCurrentChainSupportsSmartTransactions,
  getSmartTransactionsPreferenceEnabled,
} from '../../../../shared/modules/selectors';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import {
  fetchSmartTransactionsLiveness,
  setSwapsFeatureFlags,
  setSmartTransactionsRefreshInterval,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';

export function useSmartTransactionFeatureFlags() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: transactionId, txParams } = currentConfirmation ?? {};
  const isTransaction = Boolean(txParams);

  const smartTransactionsPreferenceEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );

  const currentChainSupportsSmartTransactions = useSelector(
    getCurrentChainSupportsSmartTransactions,
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

    Promise.all([fetchSwapsFeatureFlags(), fetchSmartTransactionsLiveness()()])
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
  ]);
}
