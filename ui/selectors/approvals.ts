import { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { transactionMatchesNetwork } from '../../shared/modules/transaction.utils';
import { TransactionMeta } from '../../shared/constants/transaction';
import { getCurrentChainId } from './selectors';

type ApprovalsMetaMaskState = {
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
    unapprovedTxs: {
      [transactionId: string]: TransactionMeta;
    };
  };
};

const getApprovalRequestsByType = (
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) => {
  const pendingApprovalRequests = Object.values(
    state.metamask.pendingApprovals,
  ).filter(({ type }) => type === approvalType);

  return pendingApprovalRequests;
};

const hasUnapprovedTransactionsInCurrentNetwork = (
  state: ApprovalsMetaMaskState,
) => {
  const { unapprovedTxs } = state.metamask;
  const unapprovedTxRequests = getApprovalRequestsByType(
    state,
    ApprovalType.Transaction,
  );

  const chainId = getCurrentChainId(state);

  const filteredUnapprovedTxInCurrentNetwork = unapprovedTxRequests.filter(
    ({ id }) => transactionMatchesNetwork(unapprovedTxs[id], chainId),
  );

  return filteredUnapprovedTxInCurrentNetwork.length > 0;
};

export function hasPendingApprovalsSelector(
  state: ApprovalsMetaMaskState,
  approvalType: ApprovalType,
) {
  const pendingApprovalRequests = getApprovalRequestsByType(
    state,
    approvalType,
  );

  return pendingApprovalRequests.length > 0;
}

export function hasTransactionPendingApprovalsSelector(
  state: ApprovalsMetaMaskState,
) {
  return (
    hasUnapprovedTransactionsInCurrentNetwork(state) ||
    hasPendingApprovalsSelector(state, ApprovalType.EthDecrypt) ||
    hasPendingApprovalsSelector(
      state,
      ApprovalType.EthGetEncryptionPublicKey,
    ) ||
    hasPendingApprovalsSelector(state, ApprovalType.EthSign) ||
    hasPendingApprovalsSelector(state, ApprovalType.EthSignTypedData) ||
    hasPendingApprovalsSelector(state, ApprovalType.PersonalSign)
  );
}
