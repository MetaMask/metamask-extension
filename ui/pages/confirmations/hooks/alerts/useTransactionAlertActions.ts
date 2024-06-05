import { useCallback } from 'react';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { TransactionType } from '@metamask/transaction-controller';
import useRamps from '../../../../hooks/experiences/useRamps';

export function useTransactionAlertActions() {
  const { currentConfirmation } = useCurrentConfirmation();
  const { openBuyCryptoInPdapp } = useRamps();

  const processAction = useCallback((actionKey: string) => {
    if (currentConfirmation?.type !== TransactionType.contractInteraction) {
      return;
    }

    switch (actionKey) {
      case 'buy':
        openBuyCryptoInPdapp();
        break;
    }
  }, [currentConfirmation]);

  return processAction;
}
