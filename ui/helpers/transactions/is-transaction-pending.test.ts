import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { isTransactionPending } from './is-transaction-pending';

const basePrimaryTransaction = {
  id: '1',
  status: TransactionStatus.submitted,
} as TransactionMeta;

describe('isTransactionPending', () => {
  it('returns true for submitted transactions', () => {
    expect(
      isTransactionPending({
        ...basePrimaryTransaction,
        status: TransactionStatus.submitted,
      }),
    ).toBe(true);
  });

  it('returns false for confirmed transactions', () => {
    expect(
      isTransactionPending({
        ...basePrimaryTransaction,
        status: TransactionStatus.confirmed,
      }),
    ).toBe(false);
  });
});
