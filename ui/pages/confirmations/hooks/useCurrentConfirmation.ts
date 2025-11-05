import { ApprovalType } from '@metamask/controller-utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectConfirmationData } from '../selectors/confirm';
import type { ConfirmationSelection } from '../selectors/confirm';
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
    pendingApproval,
    transactionMeta: transactionMetadata,
    signatureMessage,
  } = useSelector<ConfirmMetamaskState, ConfirmationSelection>((state) =>
    selectConfirmationData(state, paramsConfirmationId),
  );

  const pendingApprovalType = pendingApproval?.type as ApprovalType | undefined;
  const useRedesignedForSignatures = shouldUseRedesignForSignatures({
    approvalType: pendingApprovalType,
  });

  const useRedesignedForTransaction = shouldUseRedesignForTransactions({
    transactionMetadataType: transactionMetadata?.type,
  });

  const shouldUseRedesign =
    useRedesignedForSignatures || useRedesignedForTransaction;

  return useMemo(() => {
    if (pendingApprovalType === ApprovalType.AddEthereumChain) {
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
    pendingApprovalType,
  ]);
};

export default useCurrentConfirmation;
