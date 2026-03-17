import type {
  TransactionControllerState,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { EMPTY_ARRAY } from './shared';
import {
  selectTransactions,
  selectOrderedTransactions,
  selectRequiredTransactionIds,
  selectRequiredTransactions,
  selectRequiredTransactionHashes,
} from './transactionController';

type TransactionState = {
  metamask: TransactionControllerState;
};

function makeTx(
  overrides: Partial<TransactionMeta> & { id: string; time: number },
): TransactionMeta {
  return overrides as unknown as TransactionMeta;
}

function createMockState(transactions: TransactionMeta[]): TransactionState {
  return {
    metamask: { transactions } as unknown as TransactionControllerState,
  };
}

describe('transactionController selectors', () => {
  // Reset reselect memoization between tests
  beforeEach(() => {
    selectOrderedTransactions.clearCache();
    selectRequiredTransactionIds.clearCache();
    selectRequiredTransactions.clearCache();
    selectRequiredTransactionHashes.clearCache();
  });

  describe('selectTransactions', () => {
    it('returns transactions array from state', () => {
      const tx = makeTx({ id: 'tx-1', time: 1 });
      const state = createMockState([tx]);

      expect(selectTransactions(state)).toStrictEqual([tx]);
    });

    it('returns EMPTY_ARRAY when transactions is undefined', () => {
      const state = {
        metamask: {} as unknown as TransactionControllerState,
      };

      expect(selectTransactions(state)).toBe(EMPTY_ARRAY);
    });

    it('returns EMPTY_ARRAY when metamask is undefined', () => {
      const state = { metamask: undefined } as unknown as TransactionState;

      expect(selectTransactions(state)).toBe(EMPTY_ARRAY);
    });
  });

  describe('selectOrderedTransactions', () => {
    it('sorts transactions by time ascending', () => {
      const tx1 = makeTx({ id: 'a', time: 300 });
      const tx2 = makeTx({ id: 'b', time: 100 });
      const tx3 = makeTx({ id: 'c', time: 200 });
      const state = createMockState([tx1, tx2, tx3]);

      const result = selectOrderedTransactions(state);

      expect(result.map((tx) => tx.id)).toStrictEqual(['b', 'c', 'a']);
    });

    it('returns a sorted copy without mutating the original', () => {
      const tx1 = makeTx({ id: 'a', time: 200 });
      const tx2 = makeTx({ id: 'b', time: 100 });
      const original = [tx1, tx2];
      const state = createMockState(original);

      const result = selectOrderedTransactions(state);

      expect(result).not.toBe(original);
      expect(original.map((tx) => tx.id)).toStrictEqual(['a', 'b']);
    });

    it('handles empty array', () => {
      const state = createMockState([]);

      expect(selectOrderedTransactions(state)).toStrictEqual([]);
    });
  });

  describe('selectRequiredTransactionIds', () => {
    it('collects all requiredTransactionIds into a Set', () => {
      const tx = makeTx({
        id: 'parent',
        time: 1,
        requiredTransactionIds: ['req-1', 'req-2'],
      });
      const state = createMockState([tx]);

      const result = selectRequiredTransactionIds(state);

      expect(result).toStrictEqual(new Set(['req-1', 'req-2']));
    });

    it('returns empty Set when no transactions have requiredTransactionIds', () => {
      const tx = makeTx({ id: 'tx-1', time: 1 });
      const state = createMockState([tx]);

      const result = selectRequiredTransactionIds(state);

      expect(result).toStrictEqual(new Set());
    });

    it('ignores transactions without requiredTransactionIds field', () => {
      const tx1 = makeTx({
        id: 'parent',
        time: 1,
        requiredTransactionIds: ['req-1'],
      });
      const tx2 = makeTx({ id: 'normal', time: 2 });
      const state = createMockState([tx1, tx2]);

      const result = selectRequiredTransactionIds(state);

      expect(result).toStrictEqual(new Set(['req-1']));
    });

    it('deduplicates IDs across transactions', () => {
      const tx1 = makeTx({
        id: 'parent-1',
        time: 1,
        requiredTransactionIds: ['req-1', 'req-2'],
      });
      const tx2 = makeTx({
        id: 'parent-2',
        time: 2,
        requiredTransactionIds: ['req-2', 'req-3'],
      });
      const state = createMockState([tx1, tx2]);

      const result = selectRequiredTransactionIds(state);

      expect(result).toStrictEqual(new Set(['req-1', 'req-2', 'req-3']));
    });
  });

  describe('selectRequiredTransactions', () => {
    it('returns only transactions whose id is in the required set', () => {
      const parentTx = makeTx({
        id: 'parent',
        time: 3,
        requiredTransactionIds: ['req-1', 'req-2'],
      });
      const reqTx1 = makeTx({ id: 'req-1', time: 1, hash: '0xApproval' });
      const reqTx2 = makeTx({ id: 'req-2', time: 2, hash: '0xBridge' });
      const normalTx = makeTx({ id: 'normal', time: 4, hash: '0xNormal' });
      const state = createMockState([parentTx, reqTx1, reqTx2, normalTx]);

      const result = selectRequiredTransactions(state);

      expect(result.map((tx) => tx.id)).toStrictEqual(['req-1', 'req-2']);
    });

    it('returns empty array when no transactions match', () => {
      const tx = makeTx({ id: 'normal', time: 1, hash: '0xNormal' });
      const state = createMockState([tx]);

      const result = selectRequiredTransactions(state);

      expect(result).toStrictEqual([]);
    });
  });

  describe('selectRequiredTransactionHashes', () => {
    it('returns lowercased hashes of required transactions', () => {
      const parentTx = makeTx({
        id: 'parent',
        time: 3,
        requiredTransactionIds: ['req-1', 'req-2'],
      });
      const reqTx1 = makeTx({ id: 'req-1', time: 1, hash: '0xApproval' });
      const reqTx2 = makeTx({ id: 'req-2', time: 2, hash: '0xBRIDGE' });
      const state = createMockState([parentTx, reqTx1, reqTx2]);

      const result = selectRequiredTransactionHashes(state);

      expect(result).toStrictEqual(new Set(['0xapproval', '0xbridge']));
    });

    it('excludes required transactions without a hash', () => {
      const parentTx = makeTx({
        id: 'parent',
        time: 2,
        requiredTransactionIds: ['req-1', 'req-2'],
      });
      const reqTx1 = makeTx({ id: 'req-1', time: 1, hash: '0xABC' });
      const reqTxNoHash = makeTx({ id: 'req-2', time: 3 });
      const state = createMockState([parentTx, reqTx1, reqTxNoHash]);

      const result = selectRequiredTransactionHashes(state);

      expect(result).toStrictEqual(new Set(['0xabc']));
    });

    it('returns empty Set when no required transactions exist', () => {
      const normalTx = makeTx({ id: 'normal', time: 1, hash: '0xNormal' });
      const state = createMockState([normalTx]);

      const result = selectRequiredTransactionHashes(state);

      expect(result).toStrictEqual(new Set());
    });

    it('returns empty Set for empty state', () => {
      const state = createMockState([]);

      const result = selectRequiredTransactionHashes(state);

      expect(result).toStrictEqual(new Set());
    });
  });
});
