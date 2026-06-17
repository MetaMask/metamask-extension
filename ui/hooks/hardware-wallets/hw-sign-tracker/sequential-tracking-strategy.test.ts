import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import {
  createRetryGenRef,
  createTxMeta,
} from '../../../../test/helpers/hw-sign-tracker';
import { SequentialTrackingStrategy } from './sequential-tracking-strategy';
import { checkPendingAbort } from './utils';

describe('SequentialTrackingStrategy', () => {
  let strategy: SequentialTrackingStrategy;

  beforeEach(() => {
    strategy = new SequentialTrackingStrategy();
  });

  // ============================================================
  // processStatusUpdated — signed events
  // ============================================================
  describe('processStatusUpdated (signed)', () => {
    it('dispatches FirstSignatureSubmitted for approval signed', () => {
      const result = strategy.processStatusUpdated(createTxMeta());
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      });
    });

    it('dispatches TransactionSubmitted for trade signed', () => {
      const result = strategy.processStatusUpdated(
        createTxMeta({ type: TransactionType.bridge }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });

    it('skips signed event from stale tx', () => {
      // First, track a tx
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-old' }));

      // Simulate retry generation bump
      const retryGenRef = createRetryGenRef(1);
      const lastSeenRef = { current: 0 };
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      const result = strategy.processStatusUpdated(
        createTxMeta({ id: 'tx-old', type: TransactionType.bridge }),
      );
      expect(result.action).toBeNull();
    });
  });

  // ============================================================
  // processStatusUpdated — failed events
  // ============================================================
  describe('processStatusUpdated (failed)', () => {
    it('dispatches TransactionFailed for failed status on tracked tx', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));

      const result = strategy.processStatusUpdated(
        createTxMeta({ id: 'tx-1', status: TransactionStatus.failed }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('dispatches TransactionFailed for failed status on untracked tx', () => {
      const result = strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.failed }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('skips failed from stale tx after retry', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-old' }));

      const retryGenRef = createRetryGenRef(1);
      const lastSeenRef = { current: 0 };
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      const result = strategy.processStatusUpdated(
        createTxMeta({ id: 'tx-old', status: TransactionStatus.failed }),
      );
      expect(result.action).toBeNull();
    });
  });

  // ============================================================
  // processRejected
  // ============================================================
  describe('processRejected', () => {
    it('returns null for untracked tx id', () => {
      const result = strategy.processRejected(
        createTxMeta({ id: 'tx-never-tracked' }),
      );
      expect(result.action).toBeNull();
    });

    it('dispatches TransactionRejected for tracked tx', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));

      const result = strategy.processRejected(createTxMeta({ id: 'tx-1' }));
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });
  });

  // ============================================================
  // processFinished
  // ============================================================
  describe('processFinished', () => {
    it('returns null for untracked tx id', () => {
      const result = strategy.processFinished(
        createTxMeta({
          status: TransactionStatus.rejected,
          id: 'tx-untracked',
        }),
      );
      expect(result.action).toBeNull();
    });

    it('dispatches TransactionRejected for tracked tx with rejected status', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));

      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.rejected, id: 'tx-1' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionRejected,
      });
    });

    it('dispatches TransactionFailed for tracked tx with failed status', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));

      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.failed, id: 'tx-1' }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionFailed,
      });
    });

    it('returns null for non-terminal statuses', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));

      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.confirmed, id: 'tx-1' }),
      );
      expect(result.action).toBeNull();
    });
  });

  // ============================================================
  // checkRetryGeneration
  // ============================================================
  describe('checkRetryGeneration', () => {
    it('clears tracked tx ids on retry generation change', () => {
      const retryGenRef = createRetryGenRef(0);
      const lastSeenRef = { current: 0 };

      strategy.processStatusUpdated(createTxMeta({ id: 'tx-old' }));

      retryGenRef.current = 1;
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      // Stale tx should be blocked
      const result = strategy.processRejected(createTxMeta({ id: 'tx-old' }));
      expect(result.action).toBeNull();
    });

    it('processes events from new tx after retry', () => {
      const retryGenRef = createRetryGenRef(0);
      const lastSeenRef = { current: 0 };

      strategy.processStatusUpdated(createTxMeta({ id: 'tx-old' }));

      retryGenRef.current = 1;
      strategy.checkRetryGeneration(retryGenRef, lastSeenRef);

      const result = strategy.processStatusUpdated(
        createTxMeta({
          id: 'tx-new',
          type: TransactionType.bridge,
        }),
      );
      expect(result.action).toEqual({
        type: HardwareWalletSignatureEvent.TransactionSubmitted,
      });
    });
  });

  // ============================================================
  // getTrackedTxIds
  // ============================================================
  describe('getTrackedTxIds', () => {
    it('returns tx IDs observed via processStatusUpdated', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));
      strategy.processStatusUpdated(
        createTxMeta({ id: 'tx-2', type: TransactionType.bridge }),
      );
      expect(strategy.getTrackedTxIds()).toEqual(new Set(['tx-1', 'tx-2']));
    });
  });

  // ============================================================
  // checkPendingAbort (util)
  // ============================================================
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

    it('returns false when tx is not in pending set', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      const consumed = checkPendingAbort('tx-other', pending, onSettled);
      expect(consumed).toBe(false);
    });
  });

  // ============================================================
  // reset
  // ============================================================
  describe('reset', () => {
    it('clears all tracking state', () => {
      strategy.processStatusUpdated(createTxMeta({ id: 'tx-1' }));
      strategy.reset();

      expect(strategy.getTrackedTxIds()).toEqual(new Set());

      // Untracked tx should be blocked on rejected
      const result = strategy.processRejected(createTxMeta({ id: 'tx-1' }));
      expect(result.action).toBeNull();
    });
  });
});
