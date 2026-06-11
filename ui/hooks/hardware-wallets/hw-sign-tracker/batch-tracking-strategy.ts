import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { EventResult, TrackingStrategy } from './types';
import { classifySignedEvent } from './shared-filters';

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
function isFromCurrentBatch(
  transactionMeta: TransactionMeta,
  currentBatchId: string | null | undefined,
  staleBatchIds: Set<string>,
): boolean {
  const batchId = transactionMeta.batchId ?? 'batch-unknown';
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
 * @param currentBatchId
 */
function shouldBlockPendingEvent(
  currentBatchId: string | null | undefined,
): boolean {
  return currentBatchId === undefined;
}

/**
 * Batch-mode tracking strategy. Tracks transactions by batchId.
 * The first signed event locks the current batch. Events from non-current or
 * stale batches are ignored. Retry generation bumps mark old batches as stale.
 */
export class BatchTrackingStrategy implements TrackingStrategy {
  // undefined = not yet identified, null = retry pending (stale cleared),
  // string = locked to a specific batch.
  #currentBatchId: string | null | undefined = undefined;

  #staleBatchIds = new Set<string>();

  #seenBatchIds = new Set<string>();

  #trackedTxIds = new Set<string>();

  // ---------------------------------------------------------------
  // TrackingStrategy implementation
  // ---------------------------------------------------------------

  checkRetryGeneration(
    retryGenerationRef: React.RefObject<number | undefined> | undefined,
    lastSeenGenerationRef: React.MutableRefObject<number>,
  ): void {
    if (
      !retryGenerationRef ||
      retryGenerationRef.current === lastSeenGenerationRef.current
    ) {
      return;
    }
    lastSeenGenerationRef.current = retryGenerationRef.current ?? 0;

    for (const id of this.#seenBatchIds) {
      this.#staleBatchIds.add(id);
    }
    this.#seenBatchIds = new Set();
    this.#currentBatchId = null;
  }

  processStatusUpdated(transactionMeta: TransactionMeta): EventResult {
    const { status, type } = transactionMeta;
    const batchId = transactionMeta.batchId ?? 'batch-unknown';

    this.#seenBatchIds.add(batchId);
    this.#trackedTxIds.add(transactionMeta.id);

    if (status === TransactionStatus.signed) {
      return this.#handleSigned(transactionMeta, batchId, type);
    }

    if (status === TransactionStatus.failed) {
      return this.#handleFailed(transactionMeta);
    }

    return { action: null };
  }

  processRejected(transactionMeta: TransactionMeta): EventResult {
    const batchId = transactionMeta.batchId ?? 'batch-unknown';
    this.#seenBatchIds.add(batchId);
    this.#trackedTxIds.add(transactionMeta.id);

    if (shouldBlockPendingEvent(this.#currentBatchId)) {
      return { action: null };
    }
    if (
      this.#currentBatchId !== undefined &&
      !isFromCurrentBatch(
        transactionMeta,
        this.#currentBatchId,
        this.#staleBatchIds,
      )
    ) {
      return { action: null };
    }

    return {
      action: { type: HardwareWalletSignatureEvent.TransactionRejected },
    };
  }

  processFinished(transactionMeta: TransactionMeta): EventResult {
    const { status } = transactionMeta;
    const batchId = transactionMeta.batchId ?? 'batch-unknown';
    this.#seenBatchIds.add(batchId);
    this.#trackedTxIds.add(transactionMeta.id);

    if (shouldBlockPendingEvent(this.#currentBatchId)) {
      return { action: null };
    }
    if (
      this.#currentBatchId !== undefined &&
      !isFromCurrentBatch(
        transactionMeta,
        this.#currentBatchId,
        this.#staleBatchIds,
      )
    ) {
      return { action: null };
    }

    if (status === TransactionStatus.rejected) {
      return {
        action: {
          type: HardwareWalletSignatureEvent.TransactionRejected,
        },
      };
    }
    if (status === TransactionStatus.failed) {
      return {
        action: {
          type: HardwareWalletSignatureEvent.TransactionFailed,
        },
      };
    }

    return { action: null };
  }

  recordTxId(txId: string): void {
    this.#trackedTxIds.add(txId);
  }

  checkPendingAbort(
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

  getTrackedTxIds(): Set<string> {
    return this.#trackedTxIds;
  }

  reset(): void {
    this.#currentBatchId = undefined;
    this.#staleBatchIds = new Set();
    this.#seenBatchIds = new Set();
    this.#trackedTxIds = new Set();
  }

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------

  #handleSigned(
    transactionMeta: TransactionMeta,
    batchId: string,
    type: TransactionType | undefined,
  ): EventResult {
    if (this.#currentBatchId === undefined) {
      this.#currentBatchId = batchId;
    } else if (this.#currentBatchId === null) {
      if (this.#staleBatchIds.has(batchId)) {
        return { action: null };
      }
      this.#currentBatchId = batchId;
    } else if (batchId !== this.#currentBatchId) {
      return { action: null };
    }

    if (!type) {
      return { action: null };
    }
    const action = classifySignedEvent(type);
    return action ? { action } : { action: null };
  }

  #handleFailed(transactionMeta: TransactionMeta): EventResult {
    if (shouldBlockPendingEvent(this.#currentBatchId)) {
      return { action: null };
    }
    if (
      this.#currentBatchId !== undefined &&
      !isFromCurrentBatch(
        transactionMeta,
        this.#currentBatchId,
        this.#staleBatchIds,
      )
    ) {
      return { action: null };
    }

    return {
      action: { type: HardwareWalletSignatureEvent.TransactionFailed },
    };
  }
}
