import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import {
  selectAccountOverrideByTransactionId,
  TransactionPayState,
} from '../../../../selectors/transactionPayController';

export function useTransactionAccountOverride(): Hex | undefined {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  return useSelector((state: TransactionPayState) =>
    selectAccountOverrideByTransactionId(state, transactionId),
  );
}
