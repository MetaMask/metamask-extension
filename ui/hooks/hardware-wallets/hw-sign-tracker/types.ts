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

export const NO_ACTION: EventResult = { action: null };

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
   */
  processStatusUpdated(
    transactionMeta: TransactionMeta,
    classifySignedEvent?: SignedEventClassifier,
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

/** Options for configuring the hardware wallet signature tracker. */
export type ExpectedTransactionParams = {
  data?: Hex;
  to?: string;
  value?: string;
};

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
