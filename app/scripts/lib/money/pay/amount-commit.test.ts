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
const FIRST_CALL_DATA = '0xaaa1' as Hex;
const SECOND_CALL_DATA = '0xbbb2' as Hex;

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
        { nestedTransactionIndex: 0, data: FIRST_CALL_DATA },
        { nestedTransactionIndex: 1, data: SECOND_CALL_DATA },
      ],
      'test note',
      '0xf4240',
    );

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const [nextTransaction, note] = updateTransaction.mock.calls[0];
    expect(note).toBe('test note');
    expect(nextTransaction.nestedTransactions[0].data).toBe(FIRST_CALL_DATA);
    expect(nextTransaction.nestedTransactions[1].data).toBe(SECOND_CALL_DATA);
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
      [{ nestedTransactionIndex: 0, data: FIRST_CALL_DATA }],
      'test note',
    );

    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it('does not write a required amount onto an empty batch', () => {
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

    const didWrite = commitTransactionPayUpdates(
      messenger,
      TRANSACTION_ID,
      [],
      'test note',
      '0xf4240',
    );

    expect(didWrite).toBe(false);
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it('writes a required amount when the parent batch already has calldata', () => {
    const transaction = createTransaction();
    transaction.txParams.data = '0xparent' as Hex;
    const updateTransaction = jest.fn();
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'TransactionController:getState': () => ({
          transactions: [transaction],
        }),
        'TransactionController:updateTransaction': updateTransaction,
      },
    });

    const didWrite = commitTransactionPayUpdates(
      messenger,
      TRANSACTION_ID,
      [],
      'test note',
      '0xf4240',
    );

    expect(didWrite).toBe(true);
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction.mock.calls[0][0].requiredAssets[0].amount).toBe(
      '0xf4240',
    );
  });

  it('does not write when calldata and required amount are unchanged', () => {
    const transaction = createTransaction();
    transaction.txParams.data = '0xparent' as Hex;
    transaction.nestedTransactions = [
      {
        to: '0x1111111111111111111111111111111111111111',
        data: FIRST_CALL_DATA,
        value: '0x0',
      },
      {
        to: '0x2222222222222222222222222222222222222222',
        data: SECOND_CALL_DATA,
        value: '0x0',
      },
    ] as TransactionMeta['nestedTransactions'];
    const updateTransaction = jest.fn();
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'TransactionController:getState': () => ({
          transactions: [transaction],
        }),
        'TransactionController:updateTransaction': updateTransaction,
      },
    });

    const didWrite = commitTransactionPayUpdates(
      messenger,
      TRANSACTION_ID,
      [
        { nestedTransactionIndex: 0, data: FIRST_CALL_DATA },
        { nestedTransactionIndex: 1, data: SECOND_CALL_DATA },
      ],
      'test note',
      '0x0',
    );

    expect(didWrite).toBe(false);
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it('writes when nested calldata matches but the parent batch is empty', () => {
    const transaction = createTransaction();
    transaction.nestedTransactions = [
      {
        to: '0x1111111111111111111111111111111111111111',
        data: FIRST_CALL_DATA,
        value: '0x0',
      },
      {
        to: '0x2222222222222222222222222222222222222222',
        data: SECOND_CALL_DATA,
        value: '0x0',
      },
    ] as TransactionMeta['nestedTransactions'];
    const updateTransaction = jest.fn();
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'TransactionController:getState': () => ({
          transactions: [transaction],
        }),
        'TransactionController:updateTransaction': updateTransaction,
      },
    });

    const didWrite = commitTransactionPayUpdates(
      messenger,
      TRANSACTION_ID,
      [
        { nestedTransactionIndex: 0, data: FIRST_CALL_DATA },
        { nestedTransactionIndex: 1, data: SECOND_CALL_DATA },
      ],
      'test note',
      '0x0',
    );

    expect(didWrite).toBe(true);
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction.mock.calls[0][0].txParams.data).not.toBe('0x');
  });

  it('clears metadata derived from the previous amount', () => {
    const transaction = createTransaction();
    transaction.txParams.gas = '0x1' as Hex;
    transaction.gasLimitNoBuffer = '0x2' as Hex;
    transaction.gasUsed = '0x3' as Hex;
    transaction.securityAlertResponse = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Benign',
      reason: '',
    } as TransactionMeta['securityAlertResponse'];
    transaction.simulationData = {
      tokenBalanceChanges: [],
    } as TransactionMeta['simulationData'];
    transaction.simulationFails = {
      debug: {},
      reason: 'test',
    } as TransactionMeta['simulationFails'];
    transaction.revert = {
      gas: { message: 'old gas' },
      simulation: { message: 'old simulation' },
      receipt: { status: '0x0' },
    };

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
        { nestedTransactionIndex: 0, data: FIRST_CALL_DATA },
        { nestedTransactionIndex: 1, data: SECOND_CALL_DATA },
      ],
      'test note',
      '0xf4240',
    );

    const [nextTransaction] = updateTransaction.mock.calls[0];
    expect(nextTransaction.txParams.gas).toBeUndefined();
    expect(nextTransaction.gasLimitNoBuffer).toBeUndefined();
    expect(nextTransaction.gasUsed).toBeUndefined();
    expect(nextTransaction.securityAlertResponse).toBeUndefined();
    expect(nextTransaction.simulationData).toBeUndefined();
    expect(nextTransaction.simulationFails).toBeUndefined();
    expect(nextTransaction.revert).toStrictEqual({
      receipt: { status: '0x0' },
    });
  });
});
