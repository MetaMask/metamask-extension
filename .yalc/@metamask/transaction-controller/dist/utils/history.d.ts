import type { TransactionMeta } from '../types';
/**
 * Add initial history snapshot to the provided transactionMeta history.
 *
 * @param transactionMeta - TransactionMeta to add initial history snapshot to.
 */
export declare function addInitialHistorySnapshot(transactionMeta: TransactionMeta): void;
/**
 * Compares and adds history entry to the provided transactionMeta history.
 *
 * @param transactionMeta - TransactionMeta to add history entry to.
 * @param note - Note to add to history entry.
 */
export declare function updateTransactionHistory(transactionMeta: TransactionMeta, note: string): void;
//# sourceMappingURL=history.d.ts.map