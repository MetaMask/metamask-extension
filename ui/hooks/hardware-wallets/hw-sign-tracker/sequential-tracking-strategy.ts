import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type {
  EventResult,
  SignedEventClassifier,
  TrackingStrategy,
} from './types';
import { defaultEventClassifier } from './shared-filters';
import { applyRetryGenerationBump, getStatusAction } from './utils';
import { NO_ACTION } from './types';

/**
 * Sequential-mode tracking strategy. Tracks transactions by individual tx ID.
 * On retry generation bump, old tx IDs are marked stale. Only events for
 * tracked (non-stale) tx IDs are processed.
 */
export class SequentialTrackingStrategy implements TrackingStrategy {
  /**
   * Transaction IDs that are currently being tracked for status updates.
   * New transaction IDs are added as they are observed via {@link processStatusUpdated},
   * and cleared on retry-generation bumps or {@link reset}.
   */
  #trackedTxIds = new Set<string>();

  /**
   * Transaction IDs from a previous retry generation that should be ignored.
   * Populated by {@link checkRetryGeneration} when the retry generation advances,
   * ensuring events for superseded transactions are not processed.
   */
  #staleTxIds = new Set<string>();

  /**
   * Detects a retry-generation bump and marks all currently tracked transaction
   * IDs as stale. When the retry generation referenced by `retryGenerationRef`
   * advances beyond the last-seen value in `lastSeenGenerationRef`, every tracked
   * ID is moved to {@link #staleTxIds} and {@link #trackedTxIds} is reset so only
   * transactions from the new generation are processed going forward.
   *
   * @param retryGenerationRef - Ref holding the current retry generation
   * (or `undefined` if retry tracking is disabled).
   * @param lastSeenGenerationRef - Mutable ref tracking the last retry generation
   * this strategy observed; updated in place when a bump is detected.
   */
  checkRetryGeneration(
    retryGenerationRef: React.RefObject<number | undefined> | undefined,
    lastSeenGenerationRef: React.MutableRefObject<number>,
  ): void {
    applyRetryGenerationBump(
      retryGenerationRef,
      lastSeenGenerationRef,
      this.#trackedTxIds,
      this.#staleTxIds,
    );
  }

  /**
   * Processes a `transactionStatusUpdated` event in sequential mode. Ignores
   * stale (superseded) tx IDs, tracks the tx ID, and maps `signed`/`failed`
   * statuses to the corresponding signature-state-machine action.
   *
   * @param transactionMeta - The updated transaction.
   * @param classifySignedTransactionType
   * @returns The resulting action, or `{ action: null }` to emit nothing.
   */
  processStatusUpdated(
    transactionMeta: TransactionMeta,
    classifySignedTransactionType: SignedEventClassifier = defaultEventClassifier,
  ): EventResult {
    const { status, type } = transactionMeta;

    if (this.#staleTxIds.has(transactionMeta.id)) {
      return NO_ACTION;
    }

    this.#trackedTxIds.add(transactionMeta.id);

    if (status === TransactionStatus.signed) {
      if (!type) {
        return NO_ACTION;
      }
      const action = classifySignedTransactionType(transactionMeta);
      return action ? { action } : NO_ACTION;
    }

    if (status === TransactionStatus.failed) {
      return {
        action: { type: HardwareWalletSignatureEvent.TransactionFailed },
      };
    }

    return NO_ACTION;
  }

  /**
   * Processes a `transactionRejected` event in sequential mode. Emits a
   * `TransactionRejected` action only for currently tracked tx IDs.
   *
   * @param transactionMeta - The rejected transaction.
   * @returns The resulting action, or `{ action: null }` to emit nothing.
   */
  processRejected(transactionMeta: TransactionMeta): EventResult {
    if (!this.#trackedTxIds.has(transactionMeta.id)) {
      return NO_ACTION;
    }

    return {
      action: { type: HardwareWalletSignatureEvent.TransactionRejected },
    };
  }

  /**
   * Processes a `transactionFinished` event in sequential mode. Maps a finished
   * transaction's final `rejected`/`failed` status to the corresponding action,
   * but only for currently tracked tx IDs.
   *
   * @param transactionMeta - The finished transaction.
   * @returns The resulting action, or `{ action: null }` to emit nothing.
   */
  processFinished(transactionMeta: TransactionMeta): EventResult {
    const { status } = transactionMeta;

    if (!this.#trackedTxIds.has(transactionMeta.id)) {
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
   * Clears all tracking and stale state. Called on cancel, subscription
   * teardown, and when the tracker is disabled.
   */
  reset(): void {
    this.#trackedTxIds = new Set();
    this.#staleTxIds = new Set();
  }
}
