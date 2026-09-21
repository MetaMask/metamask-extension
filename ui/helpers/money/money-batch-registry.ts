import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * In-flight Money Account batches (deposit / withdraw) and the Pay child
 * transaction ids linked to them via `requiredTransactionIds`.
 *
 * Module-level state rather than Redux: the generic transaction toast listener
 * must know a money batch is in flight even when the Redux snapshot is still
 * catching up to the background (debounced `sendUpdate`). Fed from messenger
 * event payloads and deposit initiation, cleared on terminal lifecycle events.
 */
type MoneyBatchEntry = {
  childIds: Set<string>;
};

const moneyBatchesByParentId = new Map<string, MoneyBatchEntry>();

/**
 * Records or refreshes an in-flight money batch from fresh transaction
 * metadata (typically a `transactionStatusUpdated` payload). Merges any
 * `requiredTransactionIds` so Pay children can be suppressed without waiting
 * for Redux.
 *
 * @param transactionMeta - The money account parent transaction.
 */
export function registerMoneyBatchTransaction(
  transactionMeta: Pick<TransactionMeta, 'id' | 'requiredTransactionIds'>,
): void {
  const { id, requiredTransactionIds } = transactionMeta;
  if (!id) {
    return;
  }

  let entry = moneyBatchesByParentId.get(id);
  if (!entry) {
    entry = { childIds: new Set() };
    moneyBatchesByParentId.set(id, entry);
  }

  for (const childId of requiredTransactionIds ?? []) {
    entry.childIds.add(childId);
  }
}

/**
 * Marks a money batch as in flight by parent transaction id alone.
 *
 * Used at deposit initiation, before the first status event, so the generic
 * toast listener can defer decisions while Pay source legs start submitting.
 *
 * @param transactionId - The money account parent transaction id.
 */
export function registerMoneyBatchById(
  transactionId: string | undefined,
): void {
  if (!transactionId) {
    return;
  }
  if (!moneyBatchesByParentId.has(transactionId)) {
    moneyBatchesByParentId.set(transactionId, { childIds: new Set() });
  }
}

/**
 * Drops an in-flight money batch and its known children.
 *
 * @param transactionId - The money account parent transaction id.
 */
export function clearMoneyBatchById(transactionId: string | undefined): void {
  if (!transactionId) {
    return;
  }
  moneyBatchesByParentId.delete(transactionId);
}

/**
 * Drops an in-flight money batch using transaction metadata.
 *
 * @param transactionMeta - The money account parent transaction.
 */
export function clearMoneyBatchTransaction(
  transactionMeta: Pick<TransactionMeta, 'id'>,
): void {
  clearMoneyBatchById(transactionMeta.id);
}

/**
 * Whether any money account batch is currently in flight.
 *
 * @returns True when at least one money batch is registered.
 */
export function isMoneyBatchInFlight(): boolean {
  return moneyBatchesByParentId.size > 0;
}

/**
 * Whether the given transaction id is a known Pay child of an in-flight
 * money batch.
 *
 * @param id - Candidate child transaction id.
 * @returns True when a registered money batch lists this id.
 */
export function isKnownMoneyBatchChild(id: string): boolean {
  for (const entry of moneyBatchesByParentId.values()) {
    if (entry.childIds.has(id)) {
      return true;
    }
  }
  return false;
}

/**
 * Clears all registered money batches. Test-only.
 */
export function resetMoneyBatchRegistry(): void {
  moneyBatchesByParentId.clear();
}
