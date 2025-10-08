import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import {
  TransactionsRootState,
  selectUnapprovedTransactionById,
} from '../../../../selectors/transactions';
import { useApprovalRequest } from '../useApprovalRequest';

export function useUnapprovedTransaction() {
  const approvalRequest = useApprovalRequest();
  const transactionId = approvalRequest?.id ?? '';

  return useSelector((state: TransactionsRootState) =>
    selectUnapprovedTransactionById(state, transactionId),
  );
}

export function useUnapprovedTransactionWithFallback(): TransactionMeta {
  const result = useUnapprovedTransaction();

  return useMemo(
    () =>
      result ?? {
        chainId: '0x0',
        id: '',
        networkClientId: 'does-not-exist',
        status: TransactionStatus.unapproved,
        time: Date.now(),
        txParams: {
          from: '0x0',
        },
      },
    [result],
  );
}
