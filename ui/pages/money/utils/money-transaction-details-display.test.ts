import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import MOCK_MONEY_TRANSACTIONS from '../constants/mock-activity-data';
import {
  formatMoneyActivityDetailsDate,
  getMoneyActivityErrorMessage,
  getMoneyActivityExplorerUrl,
  getMoneyActivityPaidWith,
  getMoneyTransactionDetailsHeroAmount,
  shortenMoneyActivityHex,
} from './money-transaction-details-display';

function findMock(id: string) {
  const tx = MOCK_MONEY_TRANSACTIONS.find((item) => item.id === id);
  if (!tx) {
    throw new Error(`missing mock ${id}`);
  }
  return tx;
}

describe('getMoneyTransactionDetailsHeroAmount', () => {
  it('signs incoming confirmed amounts in green', () => {
    expect(
      getMoneyTransactionDetailsHeroAmount(findMock('money-tx-deposited')),
    ).toStrictEqual({
      amount: '+$1,000.00',
      isSuccessColor: true,
    });
  });

  it('signs outgoing confirmed amounts without the success color', () => {
    expect(
      getMoneyTransactionDetailsHeroAmount(findMock('money-tx-sent')),
    ).toStrictEqual({
      amount: '-$250.00',
      isSuccessColor: false,
    });
  });

  it('omits the sign for failed amounts', () => {
    expect(
      getMoneyTransactionDetailsHeroAmount(findMock('money-tx-deposit-failed')),
    ).toStrictEqual({
      amount: '$1,000.00',
      isSuccessColor: false,
    });
  });
});

describe('formatMoneyActivityDetailsDate', () => {
  it('formats the date and time in en-US', () => {
    expect(formatMoneyActivityDetailsDate(Date.UTC(2025, 6, 9, 14, 56))).toBe(
      `${new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(Date.UTC(2025, 6, 9, 14, 56))) 
        } at ${ 
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(Date.UTC(2025, 6, 9, 14, 56)))}`,
    );
  });
});

describe('shortenMoneyActivityHex', () => {
  it('returns short values unchanged', () => {
    expect(shortenMoneyActivityHex('0xabc')).toBe('0xabc');
  });

  it('truncates long hashes', () => {
    expect(
      shortenMoneyActivityHex(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef',
      ),
    ).toBe('0x1234...cdef');
  });
});

describe('getMoneyActivityPaidWith', () => {
  it('returns the subtitle for deposited rows', () => {
    expect(getMoneyActivityPaidWith(findMock('money-tx-deposited'))).toBe(
      'Transak',
    );
  });

  it('returns undefined for converted and sent rows', () => {
    expect(
      getMoneyActivityPaidWith(findMock('money-tx-converted-eth')),
    ).toBeUndefined();
    expect(getMoneyActivityPaidWith(findMock('money-tx-sent'))).toBeUndefined();
  });
});

describe('getMoneyActivityErrorMessage', () => {
  it('returns undefined when no error is present', () => {
    expect(
      getMoneyActivityErrorMessage(findMock('money-tx-deposit-failed')),
    ).toBeUndefined();
  });

  it('returns the error message when present', () => {
    const tx = {
      ...findMock('money-tx-deposit-failed'),
      status: TransactionStatus.failed,
      type: TransactionType.moneyAccountDeposit,
      error: {
        message:
          "MetaMask Pay: Relay submit: Relay execute: 500... body/executionOptions must have required property 'referrer'",
      },
    } as TransactionMeta;

    expect(getMoneyActivityErrorMessage(tx)).toBe(
      "MetaMask Pay: Relay submit: Relay execute: 500... body/executionOptions must have required property 'referrer'",
    );
  });
});

describe('getMoneyActivityExplorerUrl', () => {
  const validHash =
    '0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd';

  it('returns undefined when the hash is missing or invalid', () => {
    expect(getMoneyActivityExplorerUrl('0x8f', undefined)).toBeUndefined();
    expect(getMoneyActivityExplorerUrl('0x8f', '0xabc')).toBeUndefined();
  });

  it('returns the monad explorer URL for a valid hash', () => {
    expect(getMoneyActivityExplorerUrl('0x8f', validHash)).toBe(
      `https://monadscan.com/tx/${validHash}`,
    );
  });
});
