import { useCallback } from 'react';

import { useGasFeeContext } from '../contexts/gasFee';
import { updateEventFragment } from '../store/actions';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();

  const updateTransactionEventFragment = useCallback(
    (params) => {
      if (!transaction) {
        return;
      }
      updateEventFragment(`transaction-added-${transaction.id}`, params);
    },
    [transaction],
  );

  return {
    updateTransactionEventFragment,
  };
};
