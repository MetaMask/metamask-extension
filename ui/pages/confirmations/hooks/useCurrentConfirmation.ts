import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectConfirmationData } from '../selectors/confirm';
import { ConfirmMetamaskState } from '../types/confirm';
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
 * @returns The current confirmation data.
 */
const useCurrentConfirmation = () => {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();

  const {
    id: confirmationId,
    pendingApproval,
    transactionMeta: transactionMetadata,
    signatureMessage,
  } = useSelector((state) =>
    selectConfirmationData(
      state as ConfirmMetamaskState,
      paramsConfirmationId,
    ),
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
