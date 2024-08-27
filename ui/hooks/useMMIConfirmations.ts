import { TransactionMeta, TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { currentConfirmationSelector } from '../pages/confirmations/selectors';
import { useMMICustodySignMessage } from './useMMICustodySignMessage';
import { useMMICustodySendTransaction } from './useMMICustodySendTransaction';

export function useMMIConfirmations() {
  const { custodySignFn } = useMMICustodySignMessage();
  const { custodyTransactionFn } = useMMICustodySendTransaction();

  const currentConfirmation = useSelector(currentConfirmationSelector);

  return {
    mmiSubmitDisabled:
      currentConfirmation &&
      (currentConfirmation.type === TransactionType.personalSign ||
        currentConfirmation.type === TransactionType.signTypedData) &&
      Boolean(currentConfirmation?.custodyId),
    mmiOnSignCallback: () => custodySignFn(currentConfirmation),
    mmiOnTransactionCallback: () => custodyTransactionFn(currentConfirmation as TransactionMeta),
  };
}
