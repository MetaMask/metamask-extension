import { ApprovalType } from '@metamask/controller-utils';

import { getPendingApprovals } from '../../../selectors/approvals';
import { ConfirmMetamaskState } from '../types/confirm';

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

export function pendingConfirmationsSortedSelector(
  state: ConfirmMetamaskState,
) {
  return getPendingApprovals(state)
    .filter(({ type }) =>
      ConfirmationApprovalTypes.includes(type as ApprovalType),
    )
    .sort((a1, a2) => a1.time - a2.time);
}

export function latestPendingConfirmationSelector(state: ConfirmMetamaskState) {
  const pendingConfirmations = pendingConfirmationsSelector(state);
  return pendingConfirmations.sort((a1, a2) => a2.time - a1.time)[0];
}

export const currentConfirmationSelector = (state: ConfirmMetamaskState) =>
  state.confirm.currentConfirmation;
