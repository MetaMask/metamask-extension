import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
///: END:ONLY_INCLUDE_IF
import { ApprovalType } from '@metamask/controller-utils';
import { useMemo } from 'react';
import {
  ApprovalsMetaMaskState,
  getIsRedesignedConfirmationsDeveloperEnabled,
  getRedesignedConfirmationsEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getRedesignedTransactionsEnabled,
  ///: END:ONLY_INCLUDE_IF
  getUnapprovedTransaction,
  latestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';
import {
  REDESIGN_APPROVAL_TYPES,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  REDESIGN_TRANSACTION_TYPES,
  ///: END:ONLY_INCLUDE_IF
} from '../utils';
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

  const isRedesignedSignaturesUserSettingEnabled = useSelector(
    getRedesignedConfirmationsEnabled,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isRedesignedTransactionsUserSettingEnabled = useSelector(
    getRedesignedTransactionsEnabled,
  );
  ///: END:ONLY_INCLUDE_IF

  const isRedesignedConfirmationsDeveloperEnabled = useSelector(
    getIsRedesignedConfirmationsDeveloperEnabled,
  );

  const isRedesignedConfirmationsDeveloperSettingEnabled =
    process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled;

  const pendingApproval = useSelector((state) =>
    selectPendingApproval(state as ApprovalsMetaMaskState, confirmationId),
  );

  const signatureMessage = useSelector((state) =>
    selectUnapprovedMessage(state, confirmationId),
  );

  const transactionMetadata = useSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getUnapprovedTransaction as any)(state, confirmationId),
  ) as TransactionMeta | undefined;

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isCorrectTransactionType = REDESIGN_TRANSACTION_TYPES.includes(
    transactionMetadata?.type as TransactionType,
  );
  ///: END:ONLY_INCLUDE_IF

  const isCorrectApprovalType = REDESIGN_APPROVAL_TYPES.includes(
    pendingApproval?.type as ApprovalType,
  );

  const shouldUseRedesignForSignatures =
    (isRedesignedSignaturesUserSettingEnabled && isCorrectApprovalType) ||
    (isRedesignedConfirmationsDeveloperSettingEnabled && isCorrectApprovalType);

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const shouldUseRedesignForTransactions =
    (isRedesignedTransactionsUserSettingEnabled && isCorrectTransactionType) ||
    (isRedesignedConfirmationsDeveloperSettingEnabled &&
      isCorrectTransactionType);
  ///: END:ONLY_INCLUDE_IF

  // If the developer toggle or the build time environment variable are enabled,
  // all the signatures and transactions in development are shown. If the user
  // facing feature toggles for signature or transactions are enabled, we show
  // only confirmations that shipped (contained in `REDESIGN_APPROVAL_TYPES` and
  // `REDESIGN_TRANSACTION_TYPES` respectively).
  let shouldUseRedesign;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  shouldUseRedesign = shouldUseRedesignForSignatures;
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  shouldUseRedesign =
    shouldUseRedesignForSignatures || shouldUseRedesignForTransactions;
  ///: END:ONLY_INCLUDE_IF

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
