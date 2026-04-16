import {
  NestedTransactionMetadata,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { isBatchTransaction, hasTransactionType } from './transactions.utils';

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

  describe('hasTransactionType', () => {
    it('returns true when transaction type matches', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
      } as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [TransactionType.simpleSend]),
      ).toBe(true);
    });

    it('returns true when transaction type is in the list', () => {
      const transactionMeta = {
        type: TransactionType.tokenMethodTransfer,
      } as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [
          TransactionType.simpleSend,
          TransactionType.tokenMethodTransfer,
        ]),
      ).toBe(true);
    });

    it('returns false when transaction type does not match', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
      } as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [
          TransactionType.tokenMethodTransfer,
        ]),
      ).toBe(false);
    });

    it('returns false when transactionMeta is undefined', () => {
      expect(hasTransactionType(undefined, [TransactionType.simpleSend])).toBe(
        false,
      );
    });

    it('returns true when nested transaction type matches', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.tokenMethodTransfer },
        ],
      } as unknown as TransactionMeta;

      expect(
        hasTransactionType(transactionMeta, [
          TransactionType.tokenMethodApprove,
        ]),
      ).toBe(true);
    });

    it('returns false when neither top-level nor nested types match', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
        nestedTransactions: [{ type: TransactionType.tokenMethodTransfer }],
      } as unknown as TransactionMeta;

      expect(hasTransactionType(transactionMeta, [TransactionType.swap])).toBe(
        false,
      );
    });

    it('returns true for top-level type even with nested transactions', () => {
      const transactionMeta = {
        type: TransactionType.swap,
        nestedTransactions: [{ type: TransactionType.tokenMethodTransfer }],
      } as unknown as TransactionMeta;

      expect(hasTransactionType(transactionMeta, [TransactionType.swap])).toBe(
        true,
      );
    });

    it('returns false when nestedTransactions is empty', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
        nestedTransactions: [],
      } as unknown as TransactionMeta;

      expect(hasTransactionType(transactionMeta, [TransactionType.swap])).toBe(
        false,
      );
    });
  });
});
