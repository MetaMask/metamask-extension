import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resolvePendingApproval } from '../../../store/actions';
import { selectSmartTransactions } from '../../../selectors/toast';
import { mapSmartTransactionToastStatus } from './useSmartTransactionToasts';

// Temporary until SmartTransactionHook stops creating showSmartTransactionStatusPage approvals.
export function useResolveSmartTransactionApprovals() {
  const dispatch = useDispatch();
  const transactions = useSelector(selectSmartTransactions);
  const resolvedTxIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const tx of transactions) {
      const toastStatus = mapSmartTransactionToastStatus(
        tx.smartTransactionStatus,
        tx.evmStatus,
      );

      if (toastStatus !== 'success' && toastStatus !== 'failed') {
        continue;
      }

      if (resolvedTxIdsRef.current.has(tx.txId)) {
        continue;
      }

      resolvedTxIdsRef.current.add(tx.txId);
      dispatch(resolvePendingApproval(tx.approvalId, true));
    }
  }, [dispatch, transactions]);
}
