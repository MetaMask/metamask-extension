import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-v5-compat';
import {
  ApprovalsMetaMaskState,
  getUnapprovedTransaction,
  oldestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';
import { getPendingApprovals } from '../../../selectors/approvals';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import {
  shouldUseRedesignForSignatures,
  shouldUseRedesignForTransactions,
} from '../../../../shared/lib/confirmation.utils';

/**
 * Determine the current confirmation based on the pending approvals and controller state.
 *
 * DO NOT USE within a redesigned confirmation.
 * Instead use ConfirmContext to read the current confirmation.
 *
 * @param providedConfirmationId - Optional confirmation ID to use instead of URL params
 * @returns The current confirmation data.
 */
const useCurrentConfirmation = (providedConfirmationId?: string) => {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);
  const confirmationId =
    providedConfirmationId ?? paramsConfirmationId ?? oldestPendingApproval?.id;

  const pendingApproval = useSelector((state) =>
    selectPendingApproval(state as ApprovalsMetaMaskState, confirmationId),
  );

  const transactionMetadata = useSelector((state) => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tx = (getUnapprovedTransaction as any)(state, confirmationId);

    // If transaction not found for the specific confirmationId, try to find transaction
    // for the first pending approval that has an unapproved transaction
    // This handles cases where route params point to a signed/submitted transaction
    if (!tx && pendingApproval?.type === ApprovalType.Transaction) {
      const allPendingApprovals = getPendingApprovals(state as ApprovalsMetaMaskState);
      for (const approval of allPendingApprovals) {
        if (approval.type === ApprovalType.Transaction && approval.id !== confirmationId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const candidateTx = (getUnapprovedTransaction as any)(state, approval.id);
          if (candidateTx) {
            tx = candidateTx;
            break;
          }
        }
      }
    }

    return tx;
  }) as TransactionMeta | undefined;

  const signatureMessage = useSelector((state) =>
    selectUnapprovedMessage(state, confirmationId),
  );

  const useRedesignedForSignatures = shouldUseRedesignForSignatures({
    approvalType: pendingApproval?.type as ApprovalType,
  });

  const useRedesignedForTransaction = shouldUseRedesignForTransactions({
    transactionMetadataType: transactionMetadata?.type,
  });

  const shouldUseRedesign =
    useRedesignedForSignatures || useRedesignedForTransaction;

  return useMemo(() => {
    if (pendingApproval?.type === ApprovalType.AddEthereumChain) {
      return { currentConfirmation: pendingApproval };
    }

    if (!shouldUseRedesign) {
      return { currentConfirmation: undefined };
    }

    const currentConfirmation =
      transactionMetadata ?? signatureMessage ?? undefined;

    return { currentConfirmation };
  }, [
    transactionMetadata,
    signatureMessage,
    shouldUseRedesign,
    pendingApproval,
  ]);
};

export default useCurrentConfirmation;
