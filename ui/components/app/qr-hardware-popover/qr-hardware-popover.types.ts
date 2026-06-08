import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * Shape of the `confirmTransaction` Redux slice as used by QRHardwarePopover.
 *
 * The full slice contains additional fields (tokenData, fiatTransactionAmount,
 * etc.) but only `txData` is accessed here.
 */
export type ConfirmTransactionSlice = {
  txData: TransactionMeta;
};
