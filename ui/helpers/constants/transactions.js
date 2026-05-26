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
  TransactionType.musdConversion,
  TransactionType.musdClaim,
  TransactionType.perpsDeposit,
  TransactionType.perpsDepositAndOrder,
  TransactionType.perpsWithdraw,
]);

// Non-EVM transaction types excluded from toast notifications.
export const TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES = new Set([
  'approve',
  'receive',
]);

export const TRANSACTION_PENDING_STATUSES = new Set([
  TransactionStatus.submitted,
  SmartTransactionStatus.pending,
]);

export const TRANSACTION_SUCCESS_STATUSES = new Set([
  TransactionStatus.confirmed,
  SmartTransactionStatus.success,
]);

export const TRANSACTION_FAILED_STATUSES = new Set([
  TransactionStatus.failed,
  TransactionStatus.dropped,
  SmartTransactionStatus.cancelled,
]);
