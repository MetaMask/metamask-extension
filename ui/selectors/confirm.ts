import { ApprovalType } from '@metamask/controller-utils';
import { ApprovalControllerState } from '@metamask/approval-controller';
import { TransactionType } from '@metamask/transaction-controller';

import { getPendingApprovals } from './approvals';

type SignatureRequestType = {
  chainId?: string;
  id: string;
  msgParams?: {
    from: string;
    origin: string;
    data: string;
  };
  type: TransactionType;
};

type Confirmation = SignatureRequestType;

export type ConfirmMetamaskState = {
  confirm: {
    currentConfirmation?: Confirmation;
  };
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
    approvalFlows: ApprovalControllerState['approvalFlows'];
  };
};

const ConfirmationApprovalTypes = [
  ApprovalType.EthSign,
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
  ApprovalType.Transaction,
];

export function pendingConfirmationsSelector(state: ConfirmMetamaskState) {
  return getPendingApprovals(state).filter(({ type }) =>
    ConfirmationApprovalTypes.includes(type as ApprovalType),
  );
}

export function latestPendingConfirmationSelector(state: ConfirmMetamaskState) {
  const pendingConfirmations = pendingConfirmationsSelector(state);
  return pendingConfirmations.sort((a1, a2) => a2.time - a1.time)[0];
}

export const currentConfirmationSelector = (state: ConfirmMetamaskState) =>
  state.confirm.currentConfirmation;
