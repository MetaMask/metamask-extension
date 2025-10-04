import { useSelector } from 'react-redux';
import { selectUnapprovedTransactionById } from '../../../../selectors/transactions';
import { useApprovalRequest } from '../useApprovalRequest';
import { TransactionControllerState } from '@metamask/transaction-controller';

export function useUnapprovedTransaction() {
  const approvalRequest = useApprovalRequest();
  const transactionId = approvalRequest?.id ?? '';

  const transaction = useSelector((state: TransactionControllerState) =>
    selectUnapprovedTransactionById(state, transactionId),
  );

  return transaction;
}
