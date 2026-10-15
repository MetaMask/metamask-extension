import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  commitTransactionPayUpdates,
  parseMusdHumanAmount,
  toMusdAmountHex,
} from './amount-commit';
import { createMoneyPayMessengerMock } from './test-mocks';

const TRANSACTION_ID = 'amount-commit-tx';
const APPROVE_DATA = '0xaaa1' as Hex;
const DEPOSIT_DATA = '0xbbb2' as Hex;

function createTransaction(): TransactionMeta {
  return {
    id: TRANSACTION_ID,
    status: TransactionStatus.unapproved,
    txParams: {
      from: '0x4444444444444444444444444444444444444444',
      data: '0x',
    },
    nestedTransactions: [
      { to: '0x1111111111111111111111111111111111111111', value: '0x0' },
      { to: '0x2222222222222222222222222222222222222222', value: '0x0' },
    ],
    requiredAssets: [
      {
        address: '0x3333333333333333333333333333333333333333',
        amount: '0x0',
        standard: 'erc20',
      },
    ],
  } as unknown as TransactionMeta;
}

describe('parseMusdHumanAmount', () => {
  it('converts a whole mUSD amount into 6-decimal base units', () => {
    expect(parseMusdHumanAmount('1')).toBe(1_000_000n);
  });

  it('rounds fractional mUSD up to the next base unit by default', () => {
    expect(parseMusdHumanAmount('1.0000001')).toBe(1_000_001n);
  });

  it('rounds fractional mUSD down when ROUND_DOWN is requested', () => {
    expect(parseMusdHumanAmount('1.0000001', BigNumber.ROUND_DOWN)).toBe(
      1_000_000n,
    );
  });

  it('returns undefined for zero, negative, or non-numeric input', () => {
    expect(parseMusdHumanAmount('0')).toBeUndefined();
    expect(parseMusdHumanAmount('-1')).toBeUndefined();
    expect(parseMusdHumanAmount('not-a-number')).toBeUndefined();
  });
});

describe('toMusdAmountHex', () => {
  it('hex-encodes a base-unit amount', () => {
    expect(toMusdAmountHex(1_000_000n)).toBe('0xf4240');
  });
});

describe('commitTransactionPayUpdates', () => {
  it('writes nested calldata and requiredAssets onto the transaction', () => {
    const transaction = createTransaction();
    const updateTransaction = jest.fn();
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'TransactionController:getState': () => ({
          transactions: [transaction],
        }),
        'TransactionController:updateTransaction': updateTransaction,
      },
    });

    commitTransactionPayUpdates(
      messenger,
      TRANSACTION_ID,
      [
        { nestedTransactionIndex: 0, data: APPROVE_DATA },
        { nestedTransactionIndex: 1, data: DEPOSIT_DATA },
      ],
      'test note',
      '0xf4240',
    );

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const [nextTransaction, note] = updateTransaction.mock.calls[0];
    expect(note).toBe('test note');
    expect(nextTransaction.nestedTransactions[0].data).toBe(APPROVE_DATA);
    expect(nextTransaction.nestedTransactions[1].data).toBe(DEPOSIT_DATA);
    expect(nextTransaction.txParams.data).not.toBe('0x');
    expect(nextTransaction.requiredAssets[0].amount).toBe('0xf4240');
    expect(transaction.requiredAssets?.[0]?.amount).toBe('0x0');
  });

  it('does not write when the transaction is gone', () => {
    const updateTransaction = jest.fn();
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'TransactionController:getState': () => ({ transactions: [] }),
        'TransactionController:updateTransaction': updateTransaction,
      },
    });

    commitTransactionPayUpdates(
      messenger,
      TRANSACTION_ID,
      [{ nestedTransactionIndex: 0, data: APPROVE_DATA }],
      'test note',
    );

    expect(updateTransaction).not.toHaveBeenCalled();
  });
});
