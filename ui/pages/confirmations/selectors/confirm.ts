import { ApprovalType } from '@metamask/controller-utils';

import { createSelector } from 'reselect';
import { getPendingApprovals } from '../../../selectors/approvals';
import { createDeepEqualSelector } from '../../../../shared/modules/selectors/util';
import { ConfirmMetamaskState } from '../types/confirm';
import { APPROVAL_TYPE_EXAMPLE } from '../external/example/components/example-info';

const ConfirmationApprovalTypes = [
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
  ApprovalType.Transaction,
  'example',
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

export function selectEnableEnforcedSimulations(
  state: ConfirmMetamaskState,
  transactionId: string,
): boolean {
  return (
    state.metamask.enableEnforcedSimulationsForTransactions[transactionId] ??
    state.metamask.enableEnforcedSimulations
  );
}

export function selectEnforcedSimulationsDefaultSlippage(
  state: ConfirmMetamaskState,
): number {
  return state.metamask.enforcedSimulationsSlippage;
}

export function selectEnforcedSimulationsSlippage(
  state: ConfirmMetamaskState,
  transactionId: string,
): number {
  return (
    state.metamask.enforcedSimulationsSlippageForTransactions[transactionId] ??
    state.metamask.enforcedSimulationsSlippage
  );
}
