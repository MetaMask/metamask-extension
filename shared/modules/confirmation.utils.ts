import { TransactionType } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

export const REDESIGN_SIGNATURE_APPROVAL_TYPES = [
  ApprovalType.EthSignTypedData,
  ApprovalType.PersonalSign,
];

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

export const REDESIGN_DEV_TRANSACTION_TYPES = [
  ...REDESIGN_USER_TRANSACTION_TYPES,
];

export function shouldUseRedesignForTransactions(
  transactionMetadataType: TransactionType,
  isRedesignedTransactionsUserSettingEnabled: boolean,
  isRedesignedConfirmationsDeveloperEnabled: boolean,
): boolean {
  return (
    shouldUseRedesignForTransactionsUserMode(
      isRedesignedTransactionsUserSettingEnabled,
      transactionMetadataType,
    ) ||
    shouldUseRedesignForTransactionsDeveloperMode(
      isRedesignedConfirmationsDeveloperEnabled,
      transactionMetadataType,
    )
  );
}

export function shouldUseRedesignForSignatures(
  approvalType: ApprovalType,
  isRedesignedSignaturesUserSettingEnabled: boolean,
  isRedesignedConfirmationsDeveloperEnabled: boolean,
): boolean {
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

function isCorrectDeveloperTransactionType(
  transactionMetadataType: TransactionType,
): boolean {
  return REDESIGN_DEV_TRANSACTION_TYPES.includes(transactionMetadataType);
}

function isCorrectUserTransactionType(
  transactionMetadataType: TransactionType,
): boolean {
  return REDESIGN_USER_TRANSACTION_TYPES.includes(transactionMetadataType);
}

function isCorrectSignatureApprovalType(approvalType: ApprovalType): boolean {
  return REDESIGN_SIGNATURE_APPROVAL_TYPES.includes(approvalType);
}

function shouldUseRedesignForTransactionsDeveloperMode(
  isRedesignedConfirmationsDeveloperEnabled: boolean,
  transactionMetadataType: TransactionType,
): boolean {
  const isDeveloperModeEnabled =
    process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled;

  return (
    isDeveloperModeEnabled &&
    isCorrectDeveloperTransactionType(transactionMetadataType)
  );
}

function shouldUseRedesignForTransactionsUserMode(
  isRedesignedTransactionsUserSettingEnabled: boolean,
  transactionMetadataType: TransactionType,
): boolean {
  return (
    isRedesignedTransactionsUserSettingEnabled &&
    isCorrectUserTransactionType(transactionMetadataType)
  );
}
