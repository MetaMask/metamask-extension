import { useCallback } from 'react';

import { upsertTransactionUIMetricsFragment } from '../../../store/actions';
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

  return { updateTransactionEventFragment };
};
