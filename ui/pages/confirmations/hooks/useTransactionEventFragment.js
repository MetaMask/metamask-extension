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

  const updateTransactionEventFragment = useCallback(
    async (params, _transactionId) => {
      const transactionId = _transactionId || transaction?.id;

      if (!transactionId) {
        return;
      }
      if (!fragment) {
        await createTransactionEventFragment(transactionId);
      }
      updateEventFragment(`transaction-added-${transactionId}`, params);
    },
    [fragment, transaction],
  );

  return {
    updateTransactionEventFragment,
  };
};
