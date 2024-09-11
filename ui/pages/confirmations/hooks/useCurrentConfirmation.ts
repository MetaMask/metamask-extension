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
  getRedesignedTransactionsEnabled,
  getUnapprovedTransaction,
  latestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';
import {
  REDESIGN_APPROVAL_TYPES,
  REDESIGN_DEV_TRANSACTION_TYPES,
  REDESIGN_USER_TRANSACTION_TYPES,
} from '../utils';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import { isMMI } from '../../../helpers/utils/build-types';

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
  const latestPendingApproval = useSelector(latestPendingConfirmationSelector);
  const confirmationId = paramsConfirmationId ?? latestPendingApproval?.id;

  const isRedesignedSignaturesUserSettingEnabled = useSelector(
    getRedesignedConfirmationsEnabled,
  );

  const isRedesignedTransactionsUserSettingEnabled = useSelector(
    getRedesignedTransactionsEnabled,
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

  const isCorrectUserTransactionType = REDESIGN_USER_TRANSACTION_TYPES.includes(
    transactionMetadata?.type as TransactionType,
  );

  const isCorrectDeveloperTransactionType =
    REDESIGN_DEV_TRANSACTION_TYPES.includes(
      transactionMetadata?.type as TransactionType,
    );

  const isCorrectApprovalType = REDESIGN_APPROVAL_TYPES.includes(
    pendingApproval?.type as ApprovalType,
  );

  const shouldUseRedesignForSignatures =
    (isRedesignedSignaturesUserSettingEnabled && isCorrectApprovalType) ||
    (isRedesignedConfirmationsDeveloperSettingEnabled && isCorrectApprovalType);

  const shouldUseRedesignForTransactions =
    (isRedesignedTransactionsUserSettingEnabled &&
      isCorrectUserTransactionType) ||
    (isRedesignedConfirmationsDeveloperSettingEnabled &&
      isCorrectDeveloperTransactionType);

  // If the developer toggle or the build time environment variable are enabled,
  // all the signatures and transactions in development are shown. If the user
  // facing feature toggles for signature or transactions are enabled, we show
  // only confirmations that shipped (contained in `REDESIGN_APPROVAL_TYPES` and
  // `REDESIGN_USER_TRANSACTION_TYPES` or `REDESIGN_DEV_TRANSACTION_TYPES`
  // respectively).
  const shouldUseRedesign =
    shouldUseRedesignForSignatures ||
    (!isMMI() && shouldUseRedesignForTransactions);

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
