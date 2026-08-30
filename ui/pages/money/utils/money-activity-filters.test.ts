import { describe, expect, it } from '@jest/globals';
import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { onchainItem } from '../types/money-activity';
import {
  buildMoneyActivityBuckets,
  isMoneyActivityDeposit,
  isMoneyActivityTransfer,
  MoneyActivityFilter,
} from './money-activity-filters';

function makeTx(extra: Record<string, unknown>): TransactionMeta {
  return {
    id: 'tx-1',
    chainId: '0x1',
    time: 1,
    ...extra,
  } as unknown as TransactionMeta;
}

describe('isMoneyActivityDeposit', () => {
  it.each<TransactionType>([
    TransactionType.incoming,
    TransactionType.moneyAccountDeposit,
    TransactionType.tokenMethodTransfer,
    TransactionType.tokenMethodTransferFrom,
  ])('returns true for %s', (type) => {
    expect(isMoneyActivityDeposit(makeTx({ type }))).toBe(true);
  });

  it('returns true for a batch with a nested moneyAccountDeposit', () => {
    expect(
      isMoneyActivityDeposit(
        makeTx({
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
        }),
      ),
    ).toBe(true);
  });

  it('returns false for withdraws', () => {
    expect(
      isMoneyActivityDeposit(
        makeTx({ type: TransactionType.moneyAccountWithdraw }),
      ),
    ).toBe(false);
  });
});

describe('isMoneyActivityTransfer', () => {
  it.each<TransactionType>([
    TransactionType.moneyAccountWithdraw,
    TransactionType.simpleSend,
  ])('returns true for %s', (type) => {
    expect(isMoneyActivityTransfer(makeTx({ type }))).toBe(true);
  });

  it('returns true for a batch with a nested moneyAccountWithdraw', () => {
    expect(
      isMoneyActivityTransfer(
        makeTx({
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.moneyAccountWithdraw }],
        }),
      ),
    ).toBe(true);
  });

  it('returns false for deposits and incoming transfers', () => {
    expect(
      isMoneyActivityTransfer(
        makeTx({ type: TransactionType.moneyAccountDeposit }),
      ),
    ).toBe(false);
    expect(
      isMoneyActivityTransfer(makeTx({ type: TransactionType.incoming })),
    ).toBe(false);
  });
});

describe('buildMoneyActivityBuckets', () => {
  it('puts converted and received txs in Deposits and withdraws in Sends', () => {
    const converted = onchainItem(
      makeTx({
        id: 'converted',
        type: TransactionType.moneyAccountDeposit,
      }),
    );
    const received = onchainItem(
      makeTx({ id: 'received', type: TransactionType.incoming }),
    );
    const erc20Received = onchainItem(
      makeTx({
        id: 'erc20-received',
        type: TransactionType.tokenMethodTransfer,
      }),
    );
    const sent = onchainItem(
      makeTx({
        id: 'sent',
        type: TransactionType.moneyAccountWithdraw,
      }),
    );

    const buckets = buildMoneyActivityBuckets([
      converted,
      received,
      erc20Received,
      sent,
    ]);

    expect(
      buckets[MoneyActivityFilter.All].map((item) => item.id),
    ).toStrictEqual(['converted', 'received', 'erc20-received', 'sent']);
    expect(
      buckets[MoneyActivityFilter.Deposits].map((item) => item.id),
    ).toStrictEqual(['converted', 'received', 'erc20-received']);
    expect(
      buckets[MoneyActivityFilter.Transfers].map((item) => item.id),
    ).toStrictEqual(['sent']);
  });
});
