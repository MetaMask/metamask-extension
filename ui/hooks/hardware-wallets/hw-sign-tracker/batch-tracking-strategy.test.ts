import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import {
  createRetryGenRef,
  createTxMeta,
} from '../../../../test/helpers/hw-sign-tracker';
import { BatchTrackingStrategy } from './batch-tracking-strategy';
import { checkPendingAbort } from './utils';

describe('BatchTrackingStrategy', () => {
  let strategy: BatchTrackingStrategy;

  beforeEach(() => {
    strategy = new BatchTrackingStrategy();
  });

  describe('processStatusUpdated (signed)', () => {
    it('dispatches FirstSignatureSubmitted for approval signed when no batch is identified', () => {
      const result = strategy.processStatusUpdated(createTxMeta());
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
    });

    it('dispatches TransactionSubmitted for trade signed when no batch is identified', () => {
      const result = strategy.processStatusUpdated(
        createTxMeta({ type: TransactionType.bridge }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('locks batchId on first signed event', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      // Second signed from same batch → allowed
      const result = strategy.processStatusUpdated(
        createTxMeta({
          type: TransactionType.bridge,
          batchId: 'batch-1',
        }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('skips signed event from different batch after lock', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processStatusUpdated(
        createTxMeta({
          type: TransactionType.bridge,
          batchId: 'batch-stale',
        }),
      );
      expect(result.action).toBeNull();
    });
  });

  describe('processStatusUpdated (failed)', () => {
    it('blocks failed before batch is identified when the tx was never tracked', () => {
      const result = strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.failed }),
      );
      expect(result.action).toBeNull();
    });

    it('dispatches TransactionFailed before batch is identified when the tx was tracked', () => {
      // The tx is observed first via an initial status update (e.g. unapproved
      // on creation), so a subsequent failure is the current flow failing —
      // not a stale leftover — and must surface instead of leaving the UI stuck.
      strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.unapproved }),
      );
      const result = strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.failed }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('dispatches TransactionFailed after batch is identified (same batch)', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.failed, batchId: 'batch-1' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('skips failed from different batch', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processStatusUpdated(
        createTxMeta({
          status: TransactionStatus.failed,
          batchId: 'batch-other',
        }),
      );
      expect(result.action).toBeNull();
    });
  });

  describe('processRejected', () => {
    it('blocks rejection before batch is identified when the tx was never tracked', () => {
      const result = strategy.processRejected(createTxMeta());
      expect(result.action).toBeNull();
    });

    it('dispatches TransactionRejected before batch is identified when the tx was tracked', () => {
      strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.unapproved }),
      );
      const result = strategy.processRejected(createTxMeta());
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionRejected after batch identified (same batch)', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processRejected(
        createTxMeta({ batchId: 'batch-1' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('skips rejection from different batch', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processRejected(
        createTxMeta({ batchId: 'batch-stale' }),
      );
      expect(result.action).toBeNull();
    });
  });

  describe('processFinished', () => {
    it('blocks rejected (finished) before batch is identified when the tx was never tracked', () => {
      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.rejected }),
      );
      expect(result.action).toBeNull();
    });

    it('dispatches TransactionRejected (finished) before batch is identified when the tx was tracked', () => {
      strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.unapproved }),
      );
      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.rejected }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionRejected after batch identified (same batch)', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processFinished(
        createTxMeta({
          status: TransactionStatus.rejected,
          batchId: 'batch-1',
        }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionFailed after batch identified (same batch)', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.failed, batchId: 'batch-1' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('returns null for non-terminal statuses', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processFinished(
        createTxMeta({
          status: TransactionStatus.confirmed,
          batchId: 'batch-1',
        }),
      );
      expect(result.action).toBeNull();
    });

    it('skips finished from different batch', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      const result = strategy.processFinished(
        createTxMeta({
          status: TransactionStatus.rejected,
          batchId: 'batch-stale',
        }),
      );
      expect(result.action).toBeNull();
    });
  });

  describe('checkRetryGeneration', () => {
    it('marks seen batches as stale when generation bumps', () => {
      const retryGenRef = createRetryGenRef(0);
      const lastSeenRef = { current: 0 };

      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-old' }));

      retryGenRef.current = 1;
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      // Old batch should now be stale — finished event blocked
      const result = strategy.processFinished(
        createTxMeta({
          status: TransactionStatus.rejected,
          batchId: 'batch-old',
        }),
      );
      expect(result.action).toBeNull();
    });

    it('allows new batch events after generation reset', () => {
      const retryGenRef = createRetryGenRef(0);
      const lastSeenRef = { current: 0 };

      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-old' }));

      retryGenRef.current = 1;
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      const result = strategy.processStatusUpdated(
        createTxMeta({
          type: TransactionType.bridge,
          batchId: 'batch-new',
        }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('allows rejection from new batch before signed event establishes batch (null state)', () => {
      const retryGenRef = createRetryGenRef(0);
      const lastSeenRef = { current: 0 };

      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-old' }));

      retryGenRef.current = 1;
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      const result = strategy.processRejected(
        createTxMeta({ batchId: 'batch-new' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('blocks stale signed events after retry', () => {
      const retryGenRef = createRetryGenRef(0);
      const lastSeenRef = { current: 0 };

      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-old' }));

      retryGenRef.current = 1;
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      const result = strategy.processStatusUpdated(
        createTxMeta({
          type: TransactionType.bridge,
          batchId: 'batch-old',
        }),
      );
      expect(result.action).toBeNull();
    });
  });

  describe('getTrackedTxIds', () => {
    it('returns tx IDs observed via processStatusUpdated', () => {
      strategy.processStatusUpdated(
        createTxMeta({ id: 'tx-1', batchId: 'batch-1' }),
      );
      strategy.processStatusUpdated(
        createTxMeta({
          id: 'tx-2',
          batchId: 'batch-1',
          type: TransactionType.bridge,
        }),
      );
      expect(strategy.getTrackedTxIds()).toEqual(new Set(['tx-1', 'tx-2']));
    });
  });

  describe('checkPendingAbort (util)', () => {
    it('returns true and removes tx from pending set when found', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      const consumed = checkPendingAbort('tx-1', pending, onSettled);
      expect(consumed).toBe(true);
      expect(pending.has('tx-1')).toBe(false);
    });

    it('calls onSettled when pending set becomes empty', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      checkPendingAbort('tx-1', pending, onSettled);
      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('does not call onSettled when pending set still has items', () => {
      const pending = new Set(['tx-1', 'tx-2']);
      const onSettled = jest.fn();
      checkPendingAbort('tx-1', pending, onSettled);
      expect(onSettled).not.toHaveBeenCalled();
    });

    it('returns false when tx is not in pending set', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      const consumed = checkPendingAbort('tx-other', pending, onSettled);
      expect(consumed).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears all tracking state allowing a fresh batch', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));

      strategy.reset();

      // After reset, new batch should be accepted
      const result = strategy.processStatusUpdated(
        createTxMeta({ batchId: 'batch-2', id: 'tx-2' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
      // New tx should be tracked (not the old one)
      expect(strategy.getTrackedTxIds()).toEqual(new Set(['tx-2']));
    });
  });
});
