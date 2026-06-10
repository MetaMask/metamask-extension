import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { EventResult, TrackingStrategy } from './types';
import { classifySignedEvent } from './shared-filters';

/**
 * Sequential-mode tracking strategy. Tracks transactions by individual tx ID.
 * On retry generation bump, old tx IDs are marked stale. Only events for
 * tracked (non-stale) tx IDs are processed.
 */
export class SequentialTrackingStrategy implements TrackingStrategy {
  #trackedTxIds = new Set<string>();

  #staleTxIds = new Set<string>();

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

    for (const id of this.#trackedTxIds) {
      this.#staleTxIds.add(id);
    }
    this.#trackedTxIds = new Set();
  }

  processStatusUpdated(transactionMeta: TransactionMeta): EventResult {
    const { status, type } = transactionMeta;

    if (this.#staleTxIds.has(transactionMeta.id)) {
      return { action: null };
    }

    this.#trackedTxIds.add(transactionMeta.id);

    if (status === TransactionStatus.signed) {
      const action = classifySignedEvent(type as TransactionType);
      return action ? { action } : { action: null };
    }

    if (status === TransactionStatus.failed) {
      return {
        action: { type: HardwareWalletSignatureEvent.TransactionFailed },
      };
    }

    return { action: null };
  }

  processRejected(transactionMeta: TransactionMeta): EventResult {
    if (!this.#trackedTxIds.has(transactionMeta.id)) {
      return { action: null };
    }

    return {
      action: { type: HardwareWalletSignatureEvent.TransactionRejected },
    };
  }

  processFinished(transactionMeta: TransactionMeta): EventResult {
    const { status } = transactionMeta;

    if (!this.#trackedTxIds.has(transactionMeta.id)) {
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
    this.#trackedTxIds = new Set();
    this.#staleTxIds = new Set();
  }
}
