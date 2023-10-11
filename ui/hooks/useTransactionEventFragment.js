import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useGasFeeContext } from '../contexts/gasFee';
import { createOrUpdateTransactionEventFragment } from '../store/actions';
import { selectMatchingFragment } from '../selectors';
import { TransactionMetaMetricsEvent } from '../../shared/constants/transaction';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();
  const fragment = useSelector((state) =>
    selectMatchingFragment(state, {
      fragmentOptions: {},
      existingId: `transaction-added-${transaction?.id}`,
    }),
  );

  const updateTransactionEventFragment = useCallback(
    async (params) => {
      if (!transaction || !transaction.id) {
        return;
      }
      await createOrUpdateTransactionEventFragment(
        transaction.id,
        TransactionMetaMetricsEvent.approved,
        Boolean(fragment),
        params,
      );
    },
    [fragment, transaction],
  );

  return {
    updateTransactionEventFragment,
  };
};
