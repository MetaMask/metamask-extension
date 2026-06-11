import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { BatchTrackingStrategy } from './batch-tracking-strategy';

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
    it('blocks failed before batch is identified', () => {
      const result = strategy.processStatusUpdated(
        createTxMeta({ status: TransactionStatus.failed }),
      );
      expect(result.action).toBeNull();
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
    it('blocks rejection before batch is identified', () => {
      const result = strategy.processRejected(createTxMeta());
      expect(result.action).toBeNull();
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
    it('blocks rejected before batch is identified', () => {
      const result = strategy.processFinished(
        createTxMeta({ status: TransactionStatus.rejected }),
      );
      expect(result.action).toBeNull();
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

  describe('recordTxId / getTrackedTxIds', () => {
    it('tracks tx IDs from statusUpdated signed events', () => {
      strategy.recordTxId('tx-1');
      strategy.recordTxId('tx-2');
      expect(strategy.getTrackedTxIds()).toEqual(new Set(['tx-1', 'tx-2']));
    });
  });

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

    it('does not call onSettled when pending set still has items', () => {
      const pending = new Set(['tx-1', 'tx-2']);
      const onSettled = jest.fn();
      strategy.checkPendingAbort('tx-1', pending, onSettled);
      expect(onSettled).not.toHaveBeenCalled();
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

  describe('reset', () => {
    it('clears all tracking state allowing a fresh batch', () => {
      strategy.processStatusUpdated(createTxMeta({ batchId: 'batch-1' }));
      strategy.recordTxId('tx-1');

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
