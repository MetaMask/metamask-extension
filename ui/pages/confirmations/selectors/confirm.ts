import type { ApprovalControllerState } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { createSelector } from 'reselect';
import { createDeepEqualSelector } from '../../../../shared/modules/selectors/util';
import {
  ApprovalsMetaMaskState,
  getPendingApprovals,
  selectPendingApproval,
} from '../../../selectors/approvals';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import { getUnapprovedTransactions } from '../../../selectors/transactions';
import { ConfirmMetamaskState, SignatureRequestType } from '../types/confirm';

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

export const oldestPendingConfirmationSelector =
  firstPendingConfirmationSelector;

const selectUnapprovedTransaction = createDeepEqualSelector(
  getUnapprovedTransactions,
  (_state: ConfirmMetamaskState, transactionId?: string) => transactionId,
  (unapprovedTxs, transactionId): TransactionMeta | undefined => {
    if (!unapprovedTxs || typeof unapprovedTxs !== 'object' || !transactionId) {
      return undefined;
    }

    const typedUnapprovedTxs = unapprovedTxs as Record<string, TransactionMeta>;
    const match = Object.values(typedUnapprovedTxs).find(
      ({ id }) => id === transactionId,
    );

    return match ? { ...match } : undefined;
  },
);

export type ConfirmationSelection = {
  id?: string;
  pendingApproval?: ApprovalControllerState['pendingApprovals'][string];
  transactionMeta?: TransactionMeta;
  signatureMessage?: SignatureRequestType;
};

export const selectConfirmationData = createDeepEqualSelector(
  (state: ConfirmMetamaskState, confirmationId?: string) =>
    confirmationId ?? oldestPendingConfirmationSelector(state)?.id,
  (state: ConfirmMetamaskState, _confirmationId?: string) => state,
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
    ) as ApprovalControllerState['pendingApprovals'][string] | undefined;
    const transactionMeta = selectUnapprovedTransaction(state, effectiveId);
    const signatureMessage = selectUnapprovedMessage(state, effectiveId) as
      | SignatureRequestType
      | undefined;

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
