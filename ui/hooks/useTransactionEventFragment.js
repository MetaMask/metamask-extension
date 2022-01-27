import { useCallback } from 'react';

import { useGasFeeContext } from '../contexts/gasFee';
import { useEventFragment } from './useEventFragment';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();
  const { updateEventFragment } = useEventFragment();

  const updateTransactionEventFragment = useCallback(
    (params) => {
      if (!transaction) {
        return;
      }
      updateEventFragment(`transaction-added-${transaction.id}`, params);
    },
    [transaction, updateEventFragment],
  );

  return {
    updateTransactionEventFragment,
  };
};
