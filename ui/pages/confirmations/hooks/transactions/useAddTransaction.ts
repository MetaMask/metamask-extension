import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { addTransactionAndRouteToConfirmationPage } from '../../../../store/actions';
import { useConfirmationNavigation } from '../useConfirmationNavigation';

export function useAddTransaction() {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  const addTransaction = useCallback(
    async (
      params: TransactionParams,
      options: Parameters<TransactionController['addTransaction']>[1],
    ) => {
      const transactionMeta = (await dispatch(
        addTransactionAndRouteToConfirmationPage(params, options as never),
      )) as unknown as TransactionMeta;

      setTransactionId(transactionMeta?.id);
    },
    [dispatch],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
    }
  }, [isRedirectPending, navigateToId, transactionId]);

  return { addTransaction };
}
