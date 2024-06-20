import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useGasFeeContext } from '../../../contexts/gasFee';
import {
  createTransactionEventFragment,
  updateEventFragment,
} from '../../../store/actions';
import { selectMatchingFragment } from '../../../selectors';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();
  const fragment = useSelector((state) =>
    selectMatchingFragment(state, {
      fragmentOptions: {},
      existingId: `transaction-added-${transaction?.id}`,
    }),
  );

  const fragmentExists = Boolean(fragment);
  const gasTransactionId = transaction?.id;

  const updateTransactionEventFragment = useCallback(
    async (params, _transactionId) => {
      const transactionId = _transactionId || gasTransactionId;

      if (!transactionId) {
        return;
      }
      if (!fragmentExists) {
        await createTransactionEventFragment(transactionId);
      }
      updateEventFragment(`transaction-added-${transactionId}`, params);
    },
    [fragmentExists, gasTransactionId],
  );

  return {
    updateTransactionEventFragment,
  };
};
