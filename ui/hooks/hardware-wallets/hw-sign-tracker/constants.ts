import { TransactionType } from '@metamask/transaction-controller';

/** Transaction types that correspond to non-final bridge/swap signatures. */
export const APPROVAL_TYPES = new Set([
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
]);

/** Transaction types that correspond to final bridge/swap signatures. */
export const TRADE_TYPES = new Set([
  TransactionType.bridge,
  TransactionType.swap,
]);

/** Transaction types that can appear as fee payments in a transaction bundle. */
export const BUNDLE_FEE_TRANSACTION_TYPES = new Set([
  TransactionType.gasPayment,
]);

/** Transaction types that can appear as the send transaction in a bundle. */
export const BUNDLE_SEND_TRANSACTION_TYPES = new Set([
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
]);

/** All explicitly known transaction bundle types. */
export const BUNDLE_TRANSACTION_TYPES = new Set([
  ...BUNDLE_FEE_TRANSACTION_TYPES,
  ...BUNDLE_SEND_TRANSACTION_TYPES,
]);

/** All bridge/swap tracked transaction types (approval + trade). */
export const BRIDGE_TRANSACTION_TYPES = new Set([
  ...APPROVAL_TYPES,
  ...TRADE_TYPES,
]);

/**
 * Fallback batch ID used when a transaction's `batchId` is undefined. Groups
 * unbatched transactions together so they can be tracked consistently.
 */
export const UNKNOWN_BATCH_ID = 'batch-unknown';
