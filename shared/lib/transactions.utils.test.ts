import { NestedTransactionMetadata } from '@metamask/transaction-controller';
import { isBatchTransaction } from './transactions.utils';

describe('Transactions utils', () => {
  describe('isBatchTransaction', () => {
    it('returns true when nestedTransactions has items', () => {
      const nested: NestedTransactionMetadata[] = [{ to: '0x1', data: '0x' }];
      expect(isBatchTransaction(nested)).toBe(true);
    });

    it('returns false when nestedTransactions is empty', () => {
      expect(isBatchTransaction([])).toBe(false);
    });

    it('returns false when nestedTransactions is undefined', () => {
      expect(isBatchTransaction(undefined)).toBe(false);
    });
  });
});
