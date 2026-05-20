import { useSelector } from 'react-redux';

export function usePendingMultichainTransaction(
  approvalId: string | undefined,
) {
  return useSelector((state: any) =>
    approvalId ? state.metamask.pendingTransactions?.[approvalId] : undefined,
  );
}
