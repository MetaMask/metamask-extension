import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  ApprovalsMetaMaskState,
  getUnapprovedTransaction,
  firstPendingConfirmationSelector,
  internalSelectPendingApproval,
} from '../../../selectors';
import { internalSelectUnapprovedMessage } from '../../../selectors/signatures';
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
  const oldestPendingApproval = useSelector(firstPendingConfirmationSelector);
  const confirmationId =
    providedConfirmationId ?? paramsConfirmationId ?? oldestPendingApproval?.id;
  const confirmationIdForSelectors = confirmationId ?? '';

  const pendingApproval = useSelector((state) =>
    internalSelectPendingApproval(
      state as ApprovalsMetaMaskState,
      confirmationIdForSelectors,
    ),
  );

  const transactionMetadata = useSelector((state) =>
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getUnapprovedTransaction as any)(state, confirmationIdForSelectors),
  ) as TransactionMeta | undefined;

  const signatureMessage = useSelector((state) =>
    internalSelectUnapprovedMessage(state, confirmationIdForSelectors),
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
