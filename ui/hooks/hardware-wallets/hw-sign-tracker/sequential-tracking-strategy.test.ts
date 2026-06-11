import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { SequentialTrackingStrategy } from './sequential-tracking-strategy';

type TxMetaOverrides = Partial<{
  status: TransactionStatus;
  type: TransactionType;
  from: string;
  batchId: string;
  id: string;
}>;

function createTxMeta(overrides: TxMetaOverrides = {}): TransactionMeta {
  return {
    id: overrides.id ?? 'tx-1',
    status: overrides.status ?? TransactionStatus.signed,
    type: overrides.type ?? TransactionType.bridgeApproval,
    txParams: {
      from: overrides.from ?? '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    },
    batchId: overrides.batchId as `0x${string}` | undefined,
    chainId: '0x1',
    networkClientId: 'test',
    time: 0,
  };
}

function createRetryGenRef(
  value = 0,
): React.MutableRefObject<number | undefined> {
  return { current: value };
}

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
  // recordTxId / getTrackedTxIds
  // ============================================================
  describe('recordTxId / getTrackedTxIds', () => {
    it('tracks tx IDs from events', () => {
      strategy.recordTxId('tx-1');
      strategy.recordTxId('tx-2');
      expect(strategy.getTrackedTxIds()).toEqual(new Set(['tx-1', 'tx-2']));
    });
  });

  // ============================================================
  // checkPendingAbort
  // ============================================================
  describe('checkPendingAbort', () => {
    it('returns true and removes tx from pending set when found', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      const consumed = strategy.checkPendingAbort('tx-1', pending, onSettled);
      expect(consumed).toBe(true);
      expect(pending.has('tx-1')).toBe(false);
    });

    it('calls onSettled when pending set becomes empty', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      strategy.checkPendingAbort('tx-1', pending, onSettled);
      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('returns false when tx is not in pending set', () => {
      const pending = new Set(['tx-1']);
      const onSettled = jest.fn();
      const consumed = strategy.checkPendingAbort(
        'tx-other',
        pending,
        onSettled,
      );
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
