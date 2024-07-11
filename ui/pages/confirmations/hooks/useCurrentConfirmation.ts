import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { useMemo } from 'react';
import {
  ApprovalsMetaMaskState,
  getIsRedesignedConfirmationsDeveloperEnabled,
  getRedesignedConfirmationsEnabled,
  getUnapprovedTransaction,
  latestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';
import { REDESIGN_APPROVAL_TYPES, REDESIGN_TRANSACTION_TYPES } from '../utils';
import { selectUnapprovedMessage } from '../../../selectors/signatures';

/**
 * Determine the current confirmation based on the pending approvals and controller state.
 *
 * DO NOT USE within a redesigned confirmation.
 * Instead use currentConfirmationSelector to read the current confirmation directly from the Redux state.
 *
 * @returns The current confirmation data.
 */
const useCurrentConfirmation = () => {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const latestPendingApproval = useSelector(latestPendingConfirmationSelector);
  const confirmationId = paramsConfirmationId ?? latestPendingApproval?.id;

  const isRedesignedConfirmationsUserSettingEnabled = useSelector(
    getRedesignedConfirmationsEnabled,
  );

  const isRedesignedConfirmationsDeveloperEnabled = useSelector(
    getIsRedesignedConfirmationsDeveloperEnabled,
  );

  const isRedesignedConfirmationsDeveloperSettingEnabled =
    process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled;

  const pendingApproval = useSelector((state) =>
    selectPendingApproval(state as ApprovalsMetaMaskState, confirmationId),
  );

  const transactionMetadata = useSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getUnapprovedTransaction as any)(state, confirmationId),
  ) as TransactionMeta | undefined;

  const signatureMessage = useSelector((state) =>
    selectUnapprovedMessage(state, confirmationId),
  );

  const isCorrectTransactionType =
    isRedesignedConfirmationsDeveloperSettingEnabled &&
    REDESIGN_TRANSACTION_TYPES.includes(
      transactionMetadata?.type as TransactionType,
    );

  const isCorrectApprovalType = REDESIGN_APPROVAL_TYPES.includes(
    pendingApproval?.type as ApprovalType,
  );

  const isSIWE =
    pendingApproval?.type === TransactionType.personalSign &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (signatureMessage?.msgParams as any)?.siwe?.isSIWEMessage;

  const shouldUseRedesign =
    isRedesignedConfirmationsUserSettingEnabled &&
    (isCorrectApprovalType || isCorrectTransactionType) &&
    !isSIWE;

  return useMemo(() => {
    if (!shouldUseRedesign) {
      return { currentConfirmation: undefined };
    }

    const currentConfirmation =
      transactionMetadata ?? signatureMessage ?? undefined;

    return { currentConfirmation };
  }, [transactionMetadata, signatureMessage, shouldUseRedesign]);
};

export default useCurrentConfirmation;
