import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

/** Action types dispatched by the sign tracker to the hardware wallet state machine. */
export type HwSignTrackerAction =
  | { type: typeof HardwareWalletSignatureEvent.FirstSignatureSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionSubmitted }
  | { type: typeof HardwareWalletSignatureEvent.TransactionRejected }
  | { type: typeof HardwareWalletSignatureEvent.TransactionFailed };

/** Result of processing a transaction event through a tracking strategy. */
export type EventResult = { action: HwSignTrackerAction | null };

/**
 * Sentinel {@link EventResult} returned by tracking strategies when a processed
 * event should not dispatch any state-machine action.
 *
 * Shared as a single frozen-ish reference so strategies can return it from many
 * code paths without allocating a new object each time.
 */
export const NO_ACTION: EventResult = { action: null };

/**
 * Inspects a signed transaction and decides which state-machine action (if any)
 * it maps to. Returning `null` means the transaction does not correspond to a
 * tracked signature event.
 *
 * Used by tracking strategies to classify `signed` status updates; the default
 * implementation lives in `shared-filters.ts` and flows may override it.
 *
 * @param transactionMeta - The transaction metadata to classify.
 * @returns The matching tracker action, or `null` if no action applies.
 */
export type SignedEventClassifier = (
  transactionMeta: TransactionMeta,
) => HwSignTrackerAction | null;

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
   *
   * @param transactionMeta - The transaction whose status changed.
   * @param classifySignedTransactionType - Optional classifier used to map a
   * `signed` transaction to a tracker action; defaults to
   * `defaultEventClassifier` when omitted.
   * @returns The tracker action to dispatch, or `NO_ACTION` if none applies.
   */
  processStatusUpdated(
    transactionMeta: TransactionMeta,
    classifySignedTransactionType?: SignedEventClassifier,
  ): EventResult;

  /** Process a transactionRejected event. */
  processRejected(transactionMeta: TransactionMeta): EventResult;

  /** Process a transactionFinished event. Handles `rejected` and `failed` statuses. */
  processFinished(transactionMeta: TransactionMeta): EventResult;

  /** Get all currently tracked transaction IDs (for abort). */
  getTrackedTxIds(): Set<string>;

  /** Reset all tracking state (called on cancel, subscription teardown, enable toggle). */
  reset(): void;
};

/** Expected transaction parameters for tracking. */
export type ExpectedTransactionParams = {
  data?: Hex;
  to?: string;
  value?: string;
};

/** Options for configuring the hardware wallet signature tracker. */
export type UseHwSignTrackerOptions = {
  enabled?: boolean;
  useBatchTracking: boolean;
  includeSendBundleTransactions?: boolean;
  /**
   * Optional transaction ID allowlist for flows that can otherwise share broad
   * transaction types with unrelated same-address sends.
   */
  expectedTxIds?: string[];
  /**
   * Optional transaction param allowlist for generated batch members whose IDs
   * are not known before TransactionController creates the batch.
   */
  expectedTransactionParams?: ExpectedTransactionParams[];
};
