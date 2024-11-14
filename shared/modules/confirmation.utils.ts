import { TransactionType } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

export const REDESIGN_APPROVAL_TYPES = [
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

const isCorrectDeveloperTransactionType = (
  transactionMetadataType: TransactionType,
): boolean => REDESIGN_DEV_TRANSACTION_TYPES.includes(transactionMetadataType);

const isCorrectUserTransactionType = (
  transactionMetadataType: TransactionType,
): boolean => REDESIGN_USER_TRANSACTION_TYPES.includes(transactionMetadataType);

const isCorrectApprovalType = (approvalType: ApprovalType): boolean =>
  REDESIGN_APPROVAL_TYPES.includes(approvalType);

const shouldUseRedesignForTransactionsDeveloperMode = (
  isRedesignedConfirmationsDeveloperEnabled: boolean,
  transactionMetadataType: TransactionType,
): boolean =>
  (process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled) &&
  isCorrectDeveloperTransactionType(transactionMetadataType);

const shouldUseRedesignForTransactionsUserMode = (
  isRedesignedTransactionsUserSettingEnabled: boolean,
  transactionMetadataType: TransactionType,
): boolean =>
  isRedesignedTransactionsUserSettingEnabled &&
  isCorrectUserTransactionType(transactionMetadataType);

export const shouldUseRedesignForTransactions = (
  transactionMetadataType: TransactionType,
  isRedesignedTransactionsUserSettingEnabled: boolean,
  isRedesignedConfirmationsDeveloperEnabled: boolean,
): boolean =>
  shouldUseRedesignForTransactionsUserMode(
    isRedesignedTransactionsUserSettingEnabled,
    transactionMetadataType,
  ) ||
  shouldUseRedesignForTransactionsDeveloperMode(
    isRedesignedConfirmationsDeveloperEnabled,
    transactionMetadataType,
  );

export const shouldUseRedesignForSignatures = (
  approvalType: ApprovalType,
  isRedesignedSignaturesUserSettingEnabled: boolean,
  isRedesignedConfirmationsDeveloperEnabled: boolean,
): boolean => {
  const isRedesignedConfirmationsDeveloperSettingEnabled =
    process.env.ENABLE_CONFIRMATION_REDESIGN === 'true' ||
    isRedesignedConfirmationsDeveloperEnabled;

  if (!isCorrectApprovalType(approvalType)) {
    return false;
  }

  return (
    isRedesignedSignaturesUserSettingEnabled ||
    isRedesignedConfirmationsDeveloperSettingEnabled
  );
};
