import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { SmartTransactionStatus } from '../../../shared/constants/transaction';

export const PENDING_STATUS_HASH = {
  [TransactionStatus.unapproved]: true,
  [TransactionStatus.approved]: true,
  [TransactionStatus.submitted]: true,
};

export const PRIORITY_STATUS_HASH = {
  ...PENDING_STATUS_HASH,
  [TransactionStatus.confirmed]: true,
};

export const TOKEN_CATEGORY_HASH = {
  [TransactionType.tokenMethodApprove]: true,
  [TransactionType.tokenMethodSetApprovalForAll]: true,
  [TransactionType.tokenMethodTransfer]: true,
  [TransactionType.tokenMethodTransferFrom]: true,
  [TransactionType.tokenMethodIncreaseAllowance]: true,
};

// Transaction types excluded in unified transaction lists
export const EXCLUDED_TRANSACTION_TYPES = new Set([
  TransactionType.incoming,
  TransactionType.gasPayment,
  TransactionType.relayDeposit,
]);

// EVM transaction types excluded from toast notifications
export const TOAST_EXCLUDED_TRANSACTION_TYPES = new Set([
  TransactionType.swapApproval,
  TransactionType.bridgeApproval,
  TransactionType.bridge,
  TransactionType.shieldSubscriptionApprove,
]);

// Non-EVM transaction types excluded from toast notifications.
export const TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES = new Set([
  'approve',
  'receive',
]);

const TRANSACTION_PENDING_STATUSES = [
  TransactionStatus.submitted,
  SmartTransactionStatus.pending,
];

const TRANSACTION_SUCCESS_STATUSES = [
  TransactionStatus.confirmed,
  SmartTransactionStatus.success,
];

const TRANSACTION_FAILED_STATUSES = [
  TransactionStatus.failed,
  TransactionStatus.dropped,
  SmartTransactionStatus.cancelled,
];

export const isPending = (status) =>
  TRANSACTION_PENDING_STATUSES.includes(status);
export const isSuccess = (status) =>
  TRANSACTION_SUCCESS_STATUSES.includes(status);
export const isFailed = (status) =>
  TRANSACTION_FAILED_STATUSES.includes(status);
