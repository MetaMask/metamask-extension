import {
  NestedTransactionMetadata,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  isBatchTransaction,
  hasTransactionType,
  getPostQuoteWithdrawTransactionType,
  isPostQuoteWithdrawTransaction,
  isPerpsWithdrawTransaction,
} from './transactions.utils';

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

  describe('isPerpsWithdrawTransaction', () => {
    it('returns true when type is perpsWithdraw', () => {
      const transactionMeta = {
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      expect(isPerpsWithdrawTransaction(transactionMeta)).toBe(true);
    });

    it('returns true when a nested transaction is perpsWithdraw', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
        nestedTransactions: [
          { type: TransactionType.tokenMethodApprove },
          { type: TransactionType.perpsWithdraw },
        ],
      } as unknown as TransactionMeta;

      expect(isPerpsWithdrawTransaction(transactionMeta)).toBe(true);
    });

    it('returns false for unrelated types (e.g. perpsDeposit)', () => {
      const transactionMeta = {
        type: TransactionType.perpsDeposit,
      } as TransactionMeta;

      expect(isPerpsWithdrawTransaction(transactionMeta)).toBe(false);
    });

    it('returns false when transactionMeta is undefined', () => {
      expect(isPerpsWithdrawTransaction(undefined)).toBe(false);
    });
  });

  describe('getPostQuoteWithdrawTransactionType', () => {
    it('returns perpsWithdraw when type is perpsWithdraw', () => {
      const transactionMeta = {
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      expect(getPostQuoteWithdrawTransactionType(transactionMeta)).toBe(
        TransactionType.perpsWithdraw,
      );
    });

    it('returns perpsWithdraw when a nested transaction is perpsWithdraw', () => {
      const transactionMeta = {
        type: TransactionType.batch,
        nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
      } as unknown as TransactionMeta;

      expect(getPostQuoteWithdrawTransactionType(transactionMeta)).toBe(
        TransactionType.perpsWithdraw,
      );
    });

    it('returns undefined for unrelated transaction types', () => {
      const transactionMeta = {
        type: TransactionType.simpleSend,
      } as TransactionMeta;

      expect(getPostQuoteWithdrawTransactionType(transactionMeta)).toBe(
        undefined,
      );
    });
  });

  describe('isPostQuoteWithdrawTransaction', () => {
    it('returns true when the transaction has a post-quote withdraw type', () => {
      const transactionMeta = {
        type: TransactionType.perpsWithdraw,
      } as TransactionMeta;

      expect(isPostQuoteWithdrawTransaction(transactionMeta)).toBe(true);
    });

    it('returns false when transactionMeta is undefined', () => {
      expect(isPostQuoteWithdrawTransaction(undefined)).toBe(false);
    });
  });
});
