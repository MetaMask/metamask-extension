import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type {
  EventResult,
  SignedEventClassifier,
  TrackingStrategy,
} from './types';
import { defaultEventClassifier } from './shared-filters';
import { UNKNOWN_BATCH_ID } from './constants';
import {
  applyRetryGenerationBump,
  getStatusAction,
  shouldIgnoreBatchEvent,
} from './utils';
import { NO_ACTION } from './types';

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

  /**
   * Tx IDs that have finished signing (signed / rejected / failed / finished).
   * Cancel uses this to skip waiting for abort events that will never come.
   */
  #settledTxIds = new Set<string>();

  // ---------------------------------------------------------------
  // TrackingStrategy implementation
  // ---------------------------------------------------------------

  /**
   * Detects a retry-generation bump and marks all seen batches as stale. When
   * `retryGenerationRef` advances past `lastSeenGeneration`, every seen batch
   * ID is moved to the stale set, seen batches are cleared, and the active
   * batch is unlocked (`#currentBatchId = null`) so the next signed event
   * re-establishes the batch from the new retry generation.
   *
   * @param retryGenerationRef - External ref bumped on retry; `undefined`
   * disables retry tracking.
   * @param lastSeenGeneration - The last-seen generation value to compare against.
   * @returns The new last-seen generation when a bump was applied, otherwise
   * `null`; the caller owns persisting the returned value.
   */
  checkRetryGeneration(
    retryGenerationRef: React.RefObject<number | undefined> | undefined,
    lastSeenGeneration: number,
  ): number | null {
    const newLastSeenGeneration = applyRetryGenerationBump(
      retryGenerationRef,
      lastSeenGeneration,
      this.#seenBatchIds,
      this.#staleBatchIds,
    );
    if (newLastSeenGeneration !== null) {
      this.#currentBatchId = null;
    }
    return newLastSeenGeneration;
  }

  /**
   * Processes a `transactionStatusUpdated` event in batch mode. Records the tx
   * and its batch as seen, then delegates `signed` events to `#handleSigned`
   * (which locks/validates the active batch) and `failed` events to
   * `#handleFailed` (which ignores stale/non-current batches).
   *
   * @param transactionMeta - The updated transaction.
   * @param classifySignedTransactionType - Signed transaction type classifier.
   * @returns The resulting action, or `{ action: null }` to emit nothing.
   */
  processStatusUpdated(
    transactionMeta: TransactionMeta,
    classifySignedTransactionType: SignedEventClassifier = defaultEventClassifier,
  ): EventResult {
    const { status, type } = transactionMeta;
    const batchId = transactionMeta.batchId ?? UNKNOWN_BATCH_ID;
    const wasTracked = this.#trackedTxIds.has(transactionMeta.id);

    this.#seenBatchIds.add(batchId);
    this.#trackedTxIds.add(transactionMeta.id);

    // Mark settled even if #handleSigned/#handleFailed ignore this batch.
    // The tx is still done; cancel must not wait for abort confirmations.
    if (
      status === TransactionStatus.signed ||
      status === TransactionStatus.failed ||
      status === TransactionStatus.rejected
    ) {
      this.#settledTxIds.add(transactionMeta.id);
    }

    if (status === TransactionStatus.signed) {
      return this.#handleSigned(
        transactionMeta,
        batchId,
        type,
        classifySignedTransactionType,
      );
    }

    if (status === TransactionStatus.failed) {
      return this.#handleFailed(transactionMeta, wasTracked);
    }

    return NO_ACTION;
  }

  /**
   * Processes a `transactionRejected` event in batch mode. Records the tx and
   * its batch as seen, then emits `TransactionRejected` only when the event is
   * not blocked by `shouldIgnoreBatchEvent` (a batch is locked and the tx
   * belongs to the current, non-stale batch).
   *
   * @param transactionMeta - The rejected transaction.
   * @returns The resulting action, or `{ action: null }` to emit nothing.
   */
  processRejected(transactionMeta: TransactionMeta): EventResult {
    const batchId = transactionMeta.batchId ?? UNKNOWN_BATCH_ID;
    const wasTracked = this.#trackedTxIds.has(transactionMeta.id);
    this.#seenBatchIds.add(batchId);
    this.#trackedTxIds.add(transactionMeta.id);
    // Settled even if we drop the action — signing already finished.
    this.#settledTxIds.add(transactionMeta.id);

    if (
      shouldIgnoreBatchEvent(
        transactionMeta,
        this.#currentBatchId,
        this.#staleBatchIds,
        wasTracked,
      )
    ) {
      return NO_ACTION;
    }

    return {
      action: { type: HardwareWalletSignatureEvent.TransactionRejected },
    };
  }

  /**
   * Processes a `transactionFinished` event in batch mode. Records the tx and
   * its batch as seen, ignores stale/non-current batches via
   * `shouldIgnoreBatchEvent`, then maps the final `rejected`/`failed` status to
   * the corresponding action.
   *
   * @param transactionMeta - The finished transaction.
   * @returns The resulting action, or `{ action: null }` to emit nothing.
   */
  processFinished(transactionMeta: TransactionMeta): EventResult {
    const { status } = transactionMeta;
    const batchId = transactionMeta.batchId ?? UNKNOWN_BATCH_ID;
    const wasTracked = this.#trackedTxIds.has(transactionMeta.id);
    this.#seenBatchIds.add(batchId);
    this.#trackedTxIds.add(transactionMeta.id);
    // Finished is always terminal, even if we drop a stale-batch action.
    this.#settledTxIds.add(transactionMeta.id);

    if (
      shouldIgnoreBatchEvent(
        transactionMeta,
        this.#currentBatchId,
        this.#staleBatchIds,
        wasTracked,
      )
    ) {
      return NO_ACTION;
    }

    if (
      status === TransactionStatus.rejected ||
      status === TransactionStatus.failed
    ) {
      return { action: getStatusAction(status) };
    }

    return NO_ACTION;
  }

  /**
   * Returns the set of transaction IDs observed since the last reset (used by
   * the host hook to know which in-flight tx IDs may need aborting on cancel).
   *
   * @returns The currently tracked transaction IDs.
   */
  getTrackedTxIds(): Set<string> {
    return this.#trackedTxIds;
  }

  /**
   * True when every tracked tx has finished signing.
   * Cancel uses this to skip waiting for abort confirmations.
   *
   * @returns True when all tracked transaction IDs have settled.
   */
  hasSettledSigning(): boolean {
    for (const txId of this.#trackedTxIds) {
      if (!this.#settledTxIds.has(txId)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Clears all batch, stale, seen, and tracked-tx state. Called on cancel,
   * subscription teardown, and when the tracker is disabled.
   */
  reset(): void {
    this.#currentBatchId = undefined;
    this.#staleBatchIds = new Set();
    this.#seenBatchIds = new Set();
    this.#trackedTxIds = new Set();
    this.#settledTxIds = new Set();
  }

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------

  #handleSigned(
    transactionMeta: TransactionMeta,
    batchId: string,
    type: TransactionType | undefined,
    classifySignedTransactionType: SignedEventClassifier,
  ): EventResult {
    if (this.#currentBatchId === undefined) {
      this.#currentBatchId = batchId;
    } else if (this.#currentBatchId === null) {
      if (this.#staleBatchIds.has(batchId)) {
        return NO_ACTION;
      }
      this.#currentBatchId = batchId;
    } else if (batchId !== this.#currentBatchId) {
      return NO_ACTION;
    }

    if (!type) {
      return NO_ACTION;
    }
    const action = classifySignedTransactionType(transactionMeta);
    return action ? { action } : NO_ACTION;
  }

  #handleFailed(
    transactionMeta: TransactionMeta,
    wasTracked: boolean,
  ): EventResult {
    if (
      shouldIgnoreBatchEvent(
        transactionMeta,
        this.#currentBatchId,
        this.#staleBatchIds,
        wasTracked,
      )
    ) {
      return NO_ACTION;
    }

    return {
      action: { type: HardwareWalletSignatureEvent.TransactionFailed },
    };
  }
}
