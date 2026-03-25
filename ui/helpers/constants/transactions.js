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

// EVM transaction types excluded from toast notifications.
// Bridge transactions are handled via txHistory (bridge status controller),
// so bridge and bridgeApproval types are excluded here to avoid double-toasting.
export const EXCLUDED_TOAST_TRANSACTION_TYPES = new Set([
  TransactionType.swapApproval,
  TransactionType.bridgeApproval,
  TransactionType.bridge,
  TransactionType.shieldSubscriptionApprove,
]);

// Non-EVM transaction types excluded from toast notifications.
export const EXCLUDED_NON_EVM_TOAST_TYPES = new Set(['approve']);

export const TRANSACTION_PENDING_STATUSES = [
  TransactionStatus.submitted,
  SmartTransactionStatus.pending,
];

export const TRANSACTION_SUCCESS_STATUSES = [
  TransactionStatus.confirmed,
  SmartTransactionStatus.success,
];

export const TRANSACTION_FAILED_STATUSES = [
  TransactionStatus.failed,
  SmartTransactionStatus.cancelled,
];

export const ERC20_TRANSFER_SELECTOR = 'a9059cbb';
