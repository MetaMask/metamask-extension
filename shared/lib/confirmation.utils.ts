import { TransactionType } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

/* eslint-disable jsdoc/require-param, jsdoc/check-param-names */

/** List of signature approval types that support the redesigned confirmation flow */
const REDESIGN_SIGNATURE_APPROVAL_TYPES = [
  ApprovalType.EthSignTypedData,
  ApprovalType.PersonalSign,
];

/** List of transaction types that support the redesigned confirmation flow for users */
const REDESIGN_USER_TRANSACTION_TYPES = [
  TransactionType.contractInteraction,
  TransactionType.deployContract,
  TransactionType.tokenMethodApprove,
  TransactionType.tokenMethodIncreaseAllowance,
  TransactionType.tokenMethodSetApprovalForAll,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
  TransactionType.simpleSend,
];

/** List of transaction types that support the redesigned confirmation flow for developers */
const REDESIGN_DEV_TRANSACTION_TYPES = [...REDESIGN_USER_TRANSACTION_TYPES];

/**
 * Determines whether to use the redesigned confirmation flow for a given transaction
 * based on user settings and developer mode
 *
 * @param opts.transactionMetadataType - The type of transaction to check
 * @param opts.isRedesignedConfirmationsDeveloperEnabled - Whether developer mode is enabled
 */
export function shouldUseRedesignForTransactions({
  transactionMetadataType,
  isRedesignedConfirmationsDeveloperEnabled,
}: {
  transactionMetadataType?: TransactionType;
  isRedesignedConfirmationsDeveloperEnabled: boolean;
}): boolean {
  return (
    shouldUseRedesignForTransactionsUserMode(transactionMetadataType) ||
    shouldUseRedesignForTransactionsDeveloperMode(
      isRedesignedConfirmationsDeveloperEnabled,
      transactionMetadataType,
    )
  );
}

/**
 * Determines whether to use the redesigned confirmation flow for a given signature
 * based on user settings and developer mode
 *
 * @param opts.approvalType - The type of signature approval to check
 * @param opts.isRedesignedSignaturesUserSettingEnabled - Whether the user has enabled the redesigned flow
 * @param opts.isRedesignedConfirmationsDeveloperEnabled - Whether developer mode is enabled
 */
export function shouldUseRedesignForSignatures({
  approvalType,
  isRedesignedSignaturesUserSettingEnabled,
  isRedesignedConfirmationsDeveloperEnabled,
}: {
  approvalType?: ApprovalType;
  isRedesignedSignaturesUserSettingEnabled: boolean;
  isRedesignedConfirmationsDeveloperEnabled: boolean;
}): boolean {
  const isRedesignedConfirmationsDeveloperSettingEnabled =
    process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled;

  if (!isCorrectSignatureApprovalType(approvalType)) {
    return false;
  }

  return (
    isRedesignedSignaturesUserSettingEnabled ||
    isRedesignedConfirmationsDeveloperSettingEnabled
  );
}

/**
 * Checks if an redesign approval type is supported for signature redesign
 *
 * @param approvalType - The type of approval to check
 */
export function isCorrectSignatureApprovalType(
  approvalType?: ApprovalType,
): boolean {
  if (!approvalType) {
    return false;
  }

  return REDESIGN_SIGNATURE_APPROVAL_TYPES.includes(approvalType);
}

/**
 * Checks if a redesigned transaction type is supported in developer mode
 *
 * @param transactionMetadataType - The type of transaction to check
 */
export function isCorrectDeveloperTransactionType(
  transactionMetadataType?: TransactionType,
): boolean {
  if (!transactionMetadataType) {
    return false;
  }

  return REDESIGN_DEV_TRANSACTION_TYPES.includes(transactionMetadataType);
}

/**
 * Checks if a redesigned transaction type is supported in user mode
 *
 * @param transactionMetadataType - The type of transaction to check
 */
function isCorrectUserTransactionType(
  transactionMetadataType?: TransactionType,
): boolean {
  if (!transactionMetadataType) {
    return false;
  }

  return REDESIGN_USER_TRANSACTION_TYPES.includes(transactionMetadataType);
}

/**
 * Determines if the redesigned confirmation flow should be used for transactions
 * when in developer mode
 *
 * @param isRedesignedConfirmationsDeveloperEnabled - Whether developer mode is enabled
 * @param transactionMetadataType - The type of transaction to check
 */
function shouldUseRedesignForTransactionsDeveloperMode(
  isRedesignedConfirmationsDeveloperEnabled: boolean,
  transactionMetadataType?: TransactionType,
): boolean {
  const isDeveloperModeEnabled =
    process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled;

  return (
    isDeveloperModeEnabled &&
    isCorrectDeveloperTransactionType(transactionMetadataType)
  );
}

/**
 * Determines if the redesigned confirmation flow should be used for transactions
 * when in user mode
 *
 * @param transactionMetadataType - The type of transaction to check
 */
function shouldUseRedesignForTransactionsUserMode(
  transactionMetadataType?: TransactionType,
): boolean {
  return isCorrectUserTransactionType(transactionMetadataType);
}
