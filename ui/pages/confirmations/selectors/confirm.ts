import { ApprovalType } from '@metamask/controller-utils';

import { createSelector } from 'reselect';
import { getPendingApprovals } from '../../../selectors/approvals';
import {
  ConfirmMetamaskState,
  Confirmation,
  SecurityAlertResponse,
} from '../types/confirm';
import { createDeepEqualSelector } from '../../../selectors/util';
import { isSignatureTransactionType } from '../utils';
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

export const confirmSelector = (state: ConfirmMetamaskState) => state.confirm;

export const currentConfirmationSelector = (state: ConfirmMetamaskState) =>
  state.confirm.currentConfirmation;

export const currentSignatureRequestSecurityResponseSelector = (
  state: ConfirmMetamaskState,
) => {
  const currentConfirmation: Confirmation | undefined =
    currentConfirmationSelector(state);

  if (
    !currentConfirmation ||
    !isSignatureTransactionType(currentConfirmation)
  ) {
    return undefined;
  }

  const securityAlertId = (
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse
  )?.securityAlertId as string;

  return state.metamask.signatureSecurityAlertResponses?.[securityAlertId];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIsRedesignedConfirmationsDeveloperEnabled(state: any) {
  return getPreferences(state).isRedesignedConfirmationsDeveloperEnabled;
}
