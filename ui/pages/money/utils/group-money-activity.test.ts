import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { onchainItem } from '../types/money-activity';
import {
  formatMoneyActivityDateHeader,
  getMoneyActivityDateKeyUtc,
  groupMoneyActivityItems,
} from './group-money-activity';

function makeTx(extra: Record<string, unknown>): TransactionMeta {
  return {
    id: 'tx-1',
    chainId: '0x1',
    type: TransactionType.moneyAccountDeposit,
    ...extra,
  } as unknown as TransactionMeta;
}

describe('getMoneyActivityDateKeyUtc', () => {
  it('returns YYYY-MM-DD in UTC', () => {
    expect(getMoneyActivityDateKeyUtc(Date.UTC(2026, 4, 10, 18, 0, 0))).toBe(
      '2026-05-10',
    );
  });
});

describe('formatMoneyActivityDateHeader', () => {
  it('formats a UTC date key as a short en-US header', () => {
    expect(formatMoneyActivityDateHeader('2026-05-10')).toBe('May 10, 2026');
  });
});

describe('groupMoneyActivityItems', () => {
  it('puts pending items in a Pending section ahead of date groups', () => {
    const pending = onchainItem(
      makeTx({
        id: 'pending',
        status: TransactionStatus.submitted,
        time: Date.UTC(2026, 4, 12),
      }),
    );
    const confirmed = onchainItem(
      makeTx({
        id: 'confirmed',
        status: TransactionStatus.confirmed,
        time: Date.UTC(2026, 4, 10),
      }),
    );

    const sections = groupMoneyActivityItems([pending, confirmed], 'Pending');

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      title: 'Pending',
      isPending: true,
    });
    expect(sections[0].data.map((item) => item.id)).toStrictEqual(['pending']);
    expect(sections[1].title).toBe('May 10, 2026');
    expect(sections[1].data.map((item) => item.id)).toStrictEqual([
      'confirmed',
    ]);
  });

  it('keeps failed items in the date section', () => {
    const failed = onchainItem(
      makeTx({
        id: 'failed',
        status: TransactionStatus.failed,
        time: Date.UTC(2026, 4, 10),
      }),
    );

    const sections = groupMoneyActivityItems([failed], 'Pending');

    expect(sections).toHaveLength(1);
    expect(sections[0].isPending).toBeUndefined();
    expect(sections[0].title).toBe('May 10, 2026');
    expect(sections[0].data.map((item) => item.id)).toStrictEqual(['failed']);
  });

  it('groups settled items by UTC day newest-first', () => {
    const later = onchainItem(
      makeTx({
        id: 'later',
        status: TransactionStatus.confirmed,
        time: Date.UTC(2026, 4, 12),
      }),
    );
    const earlier = onchainItem(
      makeTx({
        id: 'earlier',
        status: TransactionStatus.confirmed,
        time: Date.UTC(2026, 4, 8),
      }),
    );

    const sections = groupMoneyActivityItems([later, earlier], 'Pending');

    expect(sections.map((section) => section.title)).toStrictEqual([
      'May 12, 2026',
      'May 8, 2026',
    ]);
  });
});
