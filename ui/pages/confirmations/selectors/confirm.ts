import { ApprovalType } from '@metamask/controller-utils';

import { createSelector } from 'reselect';
import { getPendingApprovals } from '../../../selectors/approvals';
import { ConfirmMetamaskState } from '../types/confirm';
import { createDeepEqualSelector } from '../../../selectors/util';
import { getPreferences } from '../../../selectors/selectors';

const ConfirmationApprovalTypes = [
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

const internalLatestPendingConfirmationSelector = createSelector(
  pendingConfirmationsSortedSelector,
  (pendingConfirmations) =>
    pendingConfirmations.sort((a1, a2) => a2.time - a1.time)[0],
);

export const latestPendingConfirmationSelector = createDeepEqualSelector(
  internalLatestPendingConfirmationSelector,
  (latestPendingConfirmation) => latestPendingConfirmation,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIsRedesignedConfirmationsDeveloperEnabled(state: any) {
  return getPreferences(state).isRedesignedConfirmationsDeveloperEnabled;
}
