import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

import { useConfirmContext } from '../pages/confirmations/context/confirm';
import { useMMICustodySignMessage } from './useMMICustodySignMessage';
import { useMMICustodySendTransaction } from './useMMICustodySendTransaction';

export function useMMIConfirmations() {
  const { custodySignFn } = useMMICustodySignMessage();
  const { custodyTransactionFn } = useMMICustodySendTransaction();

  const { currentConfirmation } = useConfirmContext();

  return {
    mmiSubmitDisabled:
      currentConfirmation &&
      (currentConfirmation.type === TransactionType.personalSign ||
        currentConfirmation.type === TransactionType.signTypedData) &&
      Boolean(currentConfirmation?.custodyId),
    mmiOnSignCallback: () => custodySignFn(currentConfirmation),
    mmiOnTransactionCallback: () =>
      custodyTransactionFn(currentConfirmation as TransactionMeta),
  };
}
