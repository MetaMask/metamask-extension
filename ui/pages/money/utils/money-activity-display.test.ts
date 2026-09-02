import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { IconName } from '@metamask/design-system-react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import MOCK_MONEY_TRANSACTIONS from '../constants/mock-activity-data';
import {
  getMoneyActivityDisplayInfo,
  type MoneyActivityTranslate,
} from './money-activity-display';

const t: MoneyActivityTranslate = (key, args) => {
  const message =
    (messages as Record<string, { message: string }>)[key]?.message ?? key;
  if (!args) {
    return message;
  }
  return args.reduce(
    (result, arg, index) => result.replace(`$${index + 1}`, arg),
    message,
  );
};

function makeTx(extra: Record<string, unknown>): TransactionMeta {
  return {
    id: 'tx-1',
    chainId: '0x8f',
    status: TransactionStatus.confirmed,
    time: 1,
    txParams: {
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      value: '0x0',
    },
    ...extra,
  } as unknown as TransactionMeta;
}

describe('getMoneyActivityDisplayInfo', () => {
  it('renders a confirmed deposit from mock fixtures', () => {
    const tx = MOCK_MONEY_TRANSACTIONS.find(
      (item) => item.id === 'money-tx-deposited-fiat',
    );
    if (!tx) {
      throw new Error('missing mock fixture');
    }

    expect(getMoneyActivityDisplayInfo(tx, t)).toStrictEqual({
      label: messages.moneyActivityDeposited.message,
      description: 'Transak',
      primaryAmount: '+1,000.00 mUSD',
      fiatAmount: '+$1,000.00',
      isIncoming: true,
      icon: IconName.Add,
      status: 'confirmed',
    });
  });

  it('renders a pending conversion with a present-tense label', () => {
    const display = getMoneyActivityDisplayInfo(
      makeTx({
        type: TransactionType.moneyAccountDeposit,
        status: TransactionStatus.submitted,
        moneyActivityTitleKey: 'converted',
        moneySubtitle: 'ETH → mUSD',
        transferInformation: {
          amount: '1000000000',
          decimals: 6,
          symbol: 'MUSD',
        },
      }),
      t,
    );

    expect(display.label).toBe(messages.moneyActivityConverting.message);
    expect(display.status).toBe('pending');
    expect(display.icon).toBe(IconName.Refresh);
    expect(display.primaryAmount).toBe('+1,000.00 mUSD');
  });

  it('zeros amounts and uses the failed label for a failed send', () => {
    const tx = MOCK_MONEY_TRANSACTIONS.find(
      (item) => item.id === 'money-tx-send-failed',
    );
    if (!tx) {
      throw new Error('missing mock fixture');
    }

    expect(getMoneyActivityDisplayInfo(tx, t)).toMatchObject({
      label: messages.moneyActivitySendFailed.message,
      description: 'mUSD → USDC',
      primaryAmount: '-0.00 mUSD',
      fiatAmount: '-$0.00',
      isIncoming: false,
      icon: IconName.SwapHorizontal,
      status: 'failed',
    });
  });

  it('uses an explicit subtitle over a derived received-from line', () => {
    const tx = MOCK_MONEY_TRANSACTIONS.find(
      (item) => item.id === 'money-tx-received',
    );
    if (!tx) {
      throw new Error('missing mock fixture');
    }

    const display = getMoneyActivityDisplayInfo(tx, t);
    expect(display.description).toBe('From: 0x23231...12345');
    expect(display.label).toBe(messages.moneyActivityReceived.message);
  });

  it('derives a received-from subtitle when none is set', () => {
    const display = getMoneyActivityDisplayInfo(
      makeTx({
        type: TransactionType.incoming,
        txParams: {
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0x0000000000000000000000000000000000000002',
          value: '0x0',
        },
        transferInformation: {
          amount: '1000000',
          decimals: 6,
          symbol: 'MUSD',
        },
      }),
      t,
    );

    expect(display.description).toBe('From: 0x12345...45678');
    expect(display.primaryAmount).toBe('+1.00 mUSD');
    expect(display.fiatAmount).toBe('+$1.00');
  });
});
