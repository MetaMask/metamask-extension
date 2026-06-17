import type { TransactionMeta } from '@metamask/transaction-controller';
import { UNKNOWN_BATCH_ID } from './constants';

/**
 * Checks whether a transaction belongs to the currently tracked batch (or is
 * from a stale batch that should be ignored).
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param currentBatchId - The current batch ID. `undefined` accepts all,
 * `null` rejects stale batches, a string only matches that batch.
 * @param staleBatchIds - Set of batch IDs that have been superseded by retries.
 * @returns True if the transaction belongs to the current batch.
 */
export function isFromCurrentBatch(
  transactionMeta: TransactionMeta,
  currentBatchId: string | null | undefined,
  staleBatchIds: Set<string>,
): boolean {
  const batchId = transactionMeta.batchId ?? UNKNOWN_BATCH_ID;
  if (currentBatchId === undefined) {
    return true;
  }
  if (currentBatchId === null) {
    return !staleBatchIds.has(batchId);
  }
  return batchId === currentBatchId;
}

/**
 * Returns true when no batch has been identified yet, meaning rejection and
 * finished events should be blocked until the first signed event establishes
 * the active batch.
 *
 * @param currentBatchId - The current batch ID state. `undefined` means no
 * batch has been identified yet, `null` means a retry cleared the active
 * batch (stale cleared), and a string means the batch is locked to that ID.
 */
export function shouldBlockPendingEvent(
  currentBatchId: string | null | undefined,
): boolean {
  return currentBatchId === undefined;
}

/**
 * Determines whether a pending (rejected/finished/failed) event should be
 * ignored because no batch is locked yet, or because the event belongs to a
 * stale or non-current batch.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param currentBatchId - The current batch ID state (see shouldBlockPendingEvent).
 * @param staleBatchIds - Set of batch IDs superseded by retries.
 * @returns True when the event must be ignored.
 */
export function shouldIgnoreBatchEvent(
  transactionMeta: TransactionMeta,
  currentBatchId: string | null | undefined,
  staleBatchIds: Set<string>,
): boolean {
  if (shouldBlockPendingEvent(currentBatchId)) {
    return true;
  }
  if (
    currentBatchId !== undefined &&
    !isFromCurrentBatch(transactionMeta, currentBatchId, staleBatchIds)
  ) {
    return true;
  }
  return false;
}

/**
 * Consumes a pending-abort transaction ID. When the last pending abort is
 * consumed, calls `onAllSettled`.
 *
 * @param txId - The transaction ID to consume.
 * @param pendingAbortTxIds - Set of tx IDs awaiting abort confirmation (mutated).
 * @param onAllSettled - Invoked once the set becomes empty.
 * @returns True if the event was consumed as part of abort settling.
 */
export function checkPendingAbort(
  txId: string,
  pendingAbortTxIds: Set<string>,
  onAllSettled: () => void,
): boolean {
  if (!pendingAbortTxIds.has(txId)) {
    return false;
  }
  pendingAbortTxIds.delete(txId);
  if (pendingAbortTxIds.size === 0) {
    onAllSettled();
  }
  return true;
}

/**
 * Detects a retry-generation bump and, when it advanced, moves every entry
 * from `seenSet` into `staleSet` and clears `seenSet`. Shared by both tracking
 * strategies so the bump handling stays consistent.
 *
 * @param retryGenerationRef - External ref bumped on retry (undefined disables).
 * @param lastSeenGenerationRef - Mutable ref tracking the last-seen generation; updated in place.
 * @param seenSet - The currently-seen IDs/batch IDs (mutated: cleared on bump).
 * @param staleSet - The stale IDs/batch IDs (mutated: receives seen entries on bump).
 * @returns True if a bump was detected and applied.
 */
export function applyRetryGenerationBump(
  retryGenerationRef: React.RefObject<number | undefined> | undefined,
  lastSeenGenerationRef: React.MutableRefObject<number>,
  seenSet: Set<string>,
  staleSet: Set<string>,
): boolean {
  if (
    !retryGenerationRef ||
    retryGenerationRef.current === lastSeenGenerationRef.current
  ) {
    return false;
  }
  lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;
  for (const id of seenSet) {
    staleSet.add(id);
  }
  seenSet.clear();
  return true;
}
