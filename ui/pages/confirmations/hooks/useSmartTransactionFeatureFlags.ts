import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  getCurrentChainSupportsSmartTransactions,
  getSmartTransactionsPreferenceEnabled,
} from '../../../../shared/modules/selectors';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import {
  fetchSmartTransactionsLiveness,
  setSwapsFeatureFlags,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';

export function useSmartTransactionFeatureFlags() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: transactionId, txParams } = currentConfirmation ?? {};
  const isTransaction = Boolean(txParams);

  const smartTransactionsEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );

  const currentChainSupportsSmartTransactions = useSelector(
    getCurrentChainSupportsSmartTransactions,
  );

  useEffect(() => {
    if (
      !isTransaction ||
      !transactionId ||
      !smartTransactionsEnabled ||
      !currentChainSupportsSmartTransactions
    ) {
      return;
    }

    Promise.all([
      fetchSwapsFeatureFlags(),
      fetchSmartTransactionsLiveness()(),
    ]).then(([swapsFeatureFlags]) => {
      dispatch(setSwapsFeatureFlags(swapsFeatureFlags));
    });
  }, [
    isTransaction,
    transactionId,
    smartTransactionsEnabled,
    currentChainSupportsSmartTransactions,
  ]);
}
