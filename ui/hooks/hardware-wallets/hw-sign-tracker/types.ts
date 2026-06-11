import type { TransactionMeta } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

/** Action types dispatched by the sign tracker to the hardware wallet state machine. */
export type HwSignTrackerAction =
  | { type: typeof HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionRejected }
  | { type: typeof HardwareWalletSignatureEvent.TransactionFailed };

/** Result of processing a transaction event through a tracking strategy. */
export type EventResult = { action: HwSignTrackerAction } | { action: null };

/**
 * Strategy interface for batch or sequential tracking.
 * Each strategy encapsulates the state and filtering logic for one tracking mode.
 */
export type TrackingStrategy = {
  /**
   * Called before processing any event to detect retry generation changes.
   * When the generation bumps, previously seen batches/txs are marked stale.
   *
   * @param retryGenerationRef - External ref that gets bumped on retry.
   * @param lastSeenGenerationRef - Internal ref tracking the last-seen generation.
   */
  checkRetryGeneration(
    retryGenerationRef: React.RefObject<number | undefined> | undefined,
    lastSeenGenerationRef: React.MutableRefObject<number>,
  ): void;

  /**
   * Process a transactionStatusUpdated event.
   * Handles `signed` and `failed` statuses.
   */
  processStatusUpdated(transactionMeta: TransactionMeta): EventResult;

  /** Process a transactionRejected event. */
  processRejected(transactionMeta: TransactionMeta): EventResult;

  /** Process a transactionFinished event. Handles `rejected` and `failed` statuses. */
  processFinished(transactionMeta: TransactionMeta): EventResult;

  /**
   * Record a transaction ID as tracked. Called for every matching event
   * regardless of processing outcome (used for abort tracking).
   */
  recordTxId(txId: string): void;

  /**
   * Check if a pending abort should consume this event.
   * Returns true if the event was consumed (abort settling in progress).
   *
   * @param txId - The transaction ID to check.
   * @param pendingAbortTxIds - Set of tx IDs awaiting abort confirmation.
   * @param onAllSettled - Called when all pending aborts have been consumed.
   */
  checkPendingAbort(
    txId: string,
    pendingAbortTxIds: Set<string>,
    onAllSettled: () => void,
  ): boolean;

  /** Get all currently tracked transaction IDs (for abort). */
  getTrackedTxIds(): Set<string>;

  /** Reset all tracking state (called on cancel, subscription teardown, enable toggle). */
  reset(): void;
};

/** Options for configuring the hardware wallet signature tracker. */
export type UseHwSignTrackerOptions = {
  enabled?: boolean;
  useBatchTracking: boolean;
};
