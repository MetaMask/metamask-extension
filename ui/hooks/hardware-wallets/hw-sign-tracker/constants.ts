import { TransactionType } from '@metamask/transaction-controller';

/** Bridge/swap transaction types that correspond to token approval signatures. */
export const APPROVAL_TYPES = new Set([
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
]);

/** Bridge/swap transaction types that correspond to the final trade signature. */
export const TRADE_TYPES = new Set([
  TransactionType.bridge,
  TransactionType.swap,
]);

/** All tracked bridge/swap transaction types (approval + trade). */
export const ALL_BATCH_TYPES = new Set([...APPROVAL_TYPES, ...TRADE_TYPES]);
