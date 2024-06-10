import { useCallback } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import useCurrentConfirmation from '../useCurrentConfirmation';
import useRamps from '../../../../hooks/experiences/useRamps';

export function useTransactionAlertActions() {
  const { currentConfirmation } = useCurrentConfirmation();
  const { openBuyCryptoInPdapp } = useRamps();

  const processAction = useCallback(
    (actionKey: string) => {
      if (currentConfirmation?.type !== TransactionType.contractInteraction) {
        return;
      }

      switch (actionKey) {
        case 'buy':
          openBuyCryptoInPdapp();
          break;
        default:
          console.error('Unknown alert action key:', actionKey);
          break;
      }
    },
    [currentConfirmation],
  );

  return processAction;
}
