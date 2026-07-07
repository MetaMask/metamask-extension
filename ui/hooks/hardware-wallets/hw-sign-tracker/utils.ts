import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { UNKNOWN_BATCH_ID } from './constants';
import type { HwSignTrackerAction } from './types';

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
 * Determines whether a pending (rejected/finished/failed) event should be
 * ignored because it belongs to a stale or non-current batch, or because no
 * batch is locked yet and the transaction was never observed in this flow.
 *
 * In the freshly-(re)created state (`currentBatchId === undefined`) a pending
 * event is ignored unless the transaction was already tracked earlier in this
 * flow (i.e. observed via `transactionStatusUpdated` when it was created). This
 * lets a legitimate first-signature failure/rejection through — e.g. the
 * approval tx failing before any signature locks the batch, which would
 * otherwise leave the signing UI stuck on the awaiting-signature screen — while
 * still ignoring stale leftovers from a previous flow/re-subscribe. The
 * retry-pending (`null`) and locked (string) states filter via
 * {@link isFromCurrentBatch}.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param currentBatchId - The current batch ID state.
 * @param staleBatchIds - Set of batch IDs superseded by retries.
 * @param wasTracked - Whether the transaction was already tracked earlier in
 * this flow (observed via a prior `transactionStatusUpdated`).
 * @returns True when the event must be ignored.
 */
export function shouldIgnoreBatchEvent(
  transactionMeta: TransactionMeta,
  currentBatchId: string | null | undefined,
  staleBatchIds: Set<string>,
  wasTracked: boolean,
): boolean {
  if (currentBatchId === undefined) {
    return !wasTracked;
  }
  return !isFromCurrentBatch(transactionMeta, currentBatchId, staleBatchIds);
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

/**
 * Maps a rejected or failed {@link TransactionStatus} to the corresponding
 * {@link HwSignTrackerAction}. Shared by both tracking strategies so the
 * status→action mapping stays consistent.
 *
 * @param status - The terminal transaction status.
 * @returns The corresponding action.
 */
export function getStatusAction(
  status: TransactionStatus.rejected | TransactionStatus.failed,
): HwSignTrackerAction {
  if (status === TransactionStatus.rejected) {
    return { type: HardwareWalletSignatureEvent.TransactionRejected };
  }
  return { type: HardwareWalletSignatureEvent.TransactionFailed };
}
