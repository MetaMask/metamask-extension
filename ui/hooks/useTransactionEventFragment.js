import { useCallback } from 'react';
import { TRANSACTION_EVENTS } from '../../shared/constants/transaction';

import { useGasFeeContext } from '../contexts/gasFee';
import { trackTransactionMetricsEvent } from '../store/actions';

export const useTransactionEventFragment = () => {
  const { transaction } = useGasFeeContext();

  const captureTransactionEvent = useCallback(
    ({ action, screen, variables }) => {
      if (!transaction) {
        return;
      }
      trackTransactionMetricsEvent(
        transaction.txMeta,
        TRANSACTION_EVENTS.UI_ACTION,
        {
          action,
          screen,
          ...variables,
        },
      );
    },
    [transaction],
  );

  return {
    captureTransactionEvent,
  };
};
