import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useGasFeeContext } from '../contexts/gasFee';
import {
  createTransactionEventFragment,
  updateEventFragment,
} from '../store/actions';
import { selectMatchingFragment } from '../selectors';
import { TRANSACTION_EVENTS } from '../../shared/constants/transaction';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();
  const fragment = useSelector((state) =>
    selectMatchingFragment(state, {
      fragmentOptions: {},
      existingId: `transaction-added-${transaction?.id}`,
    }),
  );

  useEffect(() => {
    if (!fragment && transaction) {
      createTransactionEventFragment(
        transaction.id,
        TRANSACTION_EVENTS.APPROVED,
      );
    }
  }, [fragment, transaction]);

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
