import type { TransactionMeta } from '../types';
/**
 * Validates the external provided transaction meta.
 *
 * @param transactionMeta - The transaction meta to validate.
 * @param confirmedTxs - The confirmed transactions in controller state.
 * @param pendingTxs - The submitted transactions in controller state.
 */
export declare function validateConfirmedExternalTransaction(transactionMeta?: TransactionMeta, confirmedTxs?: TransactionMeta[], pendingTxs?: TransactionMeta[]): void;
//# sourceMappingURL=external-transactions.d.ts.map