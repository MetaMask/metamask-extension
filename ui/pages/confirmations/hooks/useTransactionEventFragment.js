import { useCallback } from 'react';

import { useGasFeeContext } from '../../../contexts/gasFee';
import { upsertTransactionUIMetricsFragment } from '../../../store/actions';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();
  const gasTransactionId = transaction?.id;

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
