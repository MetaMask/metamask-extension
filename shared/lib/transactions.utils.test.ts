import { NestedTransactionMetadata } from '@metamask/transaction-controller';
import { isBatchTransaction } from './transactions.utils';

describe('Transactions utils', () => {
  describe('isBatchTransaction', () => {
    const FROM_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
    const TO_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
    const DIFFERENT_TO_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef';
    const NESTED_TRANSACTIONS_MOCK: NestedTransactionMetadata[] = [
      { data: '0x', to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef' },
    ];

    const testCases = [
      {
        description:
          'returns true when nestedTransactions is not empty and to equals from',
        from: FROM_MOCK,
        nestedTransactions: NESTED_TRANSACTIONS_MOCK,
        to: TO_MOCK,
        expected: true,
      },
      {
        description: 'returns false when nestedTransactions is empty',
        from: FROM_MOCK,
        nestedTransactions: [],
        to: TO_MOCK,
        expected: false,
      },
      {
        description: 'returns false when to does not equal from',
        from: FROM_MOCK,
        nestedTransactions: NESTED_TRANSACTIONS_MOCK,
        to: DIFFERENT_TO_MOCK,
        expected: false,
      },
      {
        description: 'returns false when nestedTransactions is undefined',
        from: FROM_MOCK,
        nestedTransactions: undefined,
        to: TO_MOCK,
        expected: false,
      },
      {
        description: 'returns false when to is undefined',
        from: FROM_MOCK,
        nestedTransactions: NESTED_TRANSACTIONS_MOCK,
        to: undefined,
        expected: false,
      },
      {
        description:
          'returns false when both nestedTransactions and to are undefined',
        from: FROM_MOCK,
        nestedTransactions: undefined,
        to: undefined,
        expected: false,
      },
    ];

    it.each(testCases)(
      '$description',
      ({ from, nestedTransactions, to, expected }) => {
        expect(isBatchTransaction(from, nestedTransactions, to)).toBe(expected);
      },
    );
  });
});
