import { useCallback } from 'react';

import {
  incrementTransactionUIMetricsFragmentProperty,
  upsertTransactionUIMetricsFragment,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';

export const useTransactionEventFragment = () => {
  const { currentConfirmation } = useConfirmContext();
  const gasTransactionId = currentConfirmation?.id;

  const updateTransactionEventFragment = useCallback(
    async (params, _transactionId) => {
      const transactionId = _transactionId || gasTransactionId;

      if (!transactionId) {
        return;
      }
      await upsertTransactionUIMetricsFragment(transactionId, params);
    },
    [gasTransactionId],
  );

  const incrementTransactionEventFragmentProperty = useCallback(
    async (property, _transactionId) => {
      const transactionId = _transactionId || gasTransactionId;

      if (!transactionId) {
        return;
      }

      await incrementTransactionUIMetricsFragmentProperty(
        transactionId,
        property,
      );
    },
    [gasTransactionId],
  );

  return {
    incrementTransactionEventFragmentProperty,
    updateTransactionEventFragment,
  };
};
