import { ApprovalType } from '@metamask/controller-utils';

import { createSelector } from 'reselect';
import { getPendingApprovals, selectPendingApproval } from '../../../selectors/approvals';
import { getUnapprovedTransaction } from '../../../selectors/selectors';
import { createDeepEqualSelector } from '../../../../shared/modules/selectors/util';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import { ConfirmMetamaskState } from '../types/confirm';
import { ApprovalsMetaMaskState } from '../../../selectors/approvals';

const ConfirmationApprovalTypes = [
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
  ApprovalType.Transaction,
];

export const pendingConfirmationsSelector = createSelector(
  getPendingApprovals,
  (pendingApprovals) =>
    pendingApprovals.filter(({ type }) =>
      ConfirmationApprovalTypes.includes(type as ApprovalType),
    ),
);

export const pendingConfirmationsSortedSelector = createSelector(
  pendingConfirmationsSelector,
  (pendingConfirmations) =>
    [...pendingConfirmations].sort((a1, a2) => a1.time - a2.time),
);

const firstPendingConfirmationSelector = createSelector(
  pendingConfirmationsSortedSelector,
  (pendingConfirmations) => pendingConfirmations[0],
);

export const oldestPendingConfirmationSelector = firstPendingConfirmationSelector;

export type ConfirmationSelection = {
  id?: string;
  pendingApproval?: ReturnType<typeof selectPendingApproval>;
  transactionMeta?: ReturnType<typeof getUnapprovedTransaction>;
  signatureMessage?: ReturnType<typeof selectUnapprovedMessage>;
};

export const selectConfirmationData = createDeepEqualSelector(
  (
    state: ConfirmMetamaskState,
    confirmationId?: string,
  ) => confirmationId ?? oldestPendingConfirmationSelector(state)?.id,
  (state: ConfirmMetamaskState) => state,
  (effectiveId, state): ConfirmationSelection => {
    if (!effectiveId) {
      return {
        id: undefined,
        pendingApproval: undefined,
        transactionMeta: undefined,
        signatureMessage: undefined,
      };
    }

    const pendingApproval = selectPendingApproval(
      state as ApprovalsMetaMaskState,
      effectiveId,
    );
    const transactionMeta = getUnapprovedTransaction(state, effectiveId);
    const signatureMessage = selectUnapprovedMessage(state, effectiveId);

    return {
      id: effectiveId,
      pendingApproval,
      transactionMeta,
      signatureMessage,
    };
  },
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
