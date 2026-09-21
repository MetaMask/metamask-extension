import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  clearMoneyBatchById,
  clearMoneyBatchTransaction,
  isKnownMoneyBatchChild,
  isMoneyBatchInFlight,
  mergeMoneyBatchChildrenFromTransactions,
  registerMoneyBatchById,
  registerMoneyBatchTransaction,
  resetMoneyBatchRegistry,
} from './money-batch-registry';

describe('money-batch-registry', () => {
  beforeEach(() => {
    resetMoneyBatchRegistry();
  });

  describe('registerMoneyBatchById', () => {
    it('marks a batch as in flight without children', () => {
      registerMoneyBatchById('parent-1');

      expect(isMoneyBatchInFlight()).toBe(true);
      expect(isKnownMoneyBatchChild('child-1')).toBe(false);
    });

    it('ignores empty ids and does not clear an existing entry', () => {
      registerMoneyBatchById('parent-1');
      registerMoneyBatchTransaction({
        id: 'parent-1',
        requiredTransactionIds: ['child-1'],
      });
      registerMoneyBatchById(undefined);
      registerMoneyBatchById('parent-1');

      expect(isKnownMoneyBatchChild('child-1')).toBe(true);
    });
  });

  describe('registerMoneyBatchTransaction', () => {
    it('merges requiredTransactionIds into the known-child set', () => {
      registerMoneyBatchTransaction({
        id: 'parent-1',
        requiredTransactionIds: ['child-1'],
      });
      registerMoneyBatchTransaction({
        id: 'parent-1',
        requiredTransactionIds: ['child-2'],
      });

      expect(isKnownMoneyBatchChild('child-1')).toBe(true);
      expect(isKnownMoneyBatchChild('child-2')).toBe(true);
      expect(isKnownMoneyBatchChild('other')).toBe(false);
    });

    it('ignores metadata without an id', () => {
      registerMoneyBatchTransaction({
        id: '',
        requiredTransactionIds: ['child-1'],
      } as Pick<TransactionMeta, 'id' | 'requiredTransactionIds'>);

      expect(isMoneyBatchInFlight()).toBe(false);
    });
  });

  describe('mergeMoneyBatchChildrenFromTransactions', () => {
    it('merges requiredTransactionIds into already-registered parents only', () => {
      registerMoneyBatchById('parent-1');
      mergeMoneyBatchChildrenFromTransactions([
        { id: 'parent-1', requiredTransactionIds: ['child-1'] },
        { id: 'other', requiredTransactionIds: ['child-other'] },
      ]);

      expect(isKnownMoneyBatchChild('child-1')).toBe(true);
      expect(isKnownMoneyBatchChild('child-other')).toBe(false);
      expect(isMoneyBatchInFlight()).toBe(true);
    });
  });

  describe('clearMoneyBatchById / clearMoneyBatchTransaction', () => {
    it('drops the parent and its known children', () => {
      registerMoneyBatchTransaction({
        id: 'parent-1',
        requiredTransactionIds: ['child-1'],
      });
      clearMoneyBatchTransaction({ id: 'parent-1' });

      expect(isMoneyBatchInFlight()).toBe(false);
      expect(isKnownMoneyBatchChild('child-1')).toBe(false);
    });

    it('clearMoneyBatchById is a no-op for unknown or empty ids', () => {
      registerMoneyBatchById('parent-1');
      clearMoneyBatchById(undefined);
      clearMoneyBatchById('missing');

      expect(isMoneyBatchInFlight()).toBe(true);
      clearMoneyBatchById('parent-1');
      expect(isMoneyBatchInFlight()).toBe(false);
    });
  });
});
