import { ApprovalType } from '@metamask/controller-utils';

import { createSelector } from 'reselect';
import { getPendingApprovals } from '../../../selectors/approvals';
import { getPreferences } from '../../../selectors/selectors';
import { createDeepEqualSelector } from '../../../selectors/util';
import { ConfirmMetamaskState } from '../types/confirm';

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

const firstPendingConfirmationSelector = createSelector(
  pendingConfirmationsSortedSelector,
  (pendingConfirmations) => pendingConfirmations[0],
);

export const oldestPendingConfirmationSelector = createDeepEqualSelector(
  firstPendingConfirmationSelector,
  (firstPendingConfirmation) => firstPendingConfirmation,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIsRedesignedConfirmationsDeveloperEnabled(state: any) {
  return getPreferences(state).isRedesignedConfirmationsDeveloperEnabled;
}
