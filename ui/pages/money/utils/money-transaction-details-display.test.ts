import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '@metamask/money-account-utils';
import type { Hex } from '@metamask/utils';
import MOCK_MONEY_TRANSACTIONS from '../constants/mock-activity-data';
import {
  formatMoneyActivityDetailsDate,
  getMoneyActivityAsset,
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

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex;
const MAINNET_CHAIN_ID = '0x1' as Hex;

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

  it('uses requiredAssets when transferInformation is missing', () => {
    expect(
      getMoneyTransactionDetailsHeroAmount({
        id: 'live-deposit',
        chainId: '0x8f',
        status: TransactionStatus.confirmed,
        type: TransactionType.moneyAccountDeposit,
        requiredAssets: [
          {
            address: MUSD_TOKEN_ADDRESS,
            amount: '2500000',
          },
        ],
        txParams: { from: '0x1', to: '0x2', value: '0x0' },
      } as unknown as TransactionMeta),
    ).toStrictEqual({
      amount: '+$2.50',
      isSuccessColor: true,
    });
  });

  it('falls back to Pay fiat when no transfer or requiredAssets amount exists', () => {
    expect(
      getMoneyTransactionDetailsHeroAmount({
        id: 'quoted-deposit',
        chainId: '0x8f',
        status: TransactionStatus.confirmed,
        type: TransactionType.moneyAccountDeposit,
        metamaskPay: { targetFiat: '10.25' },
        txParams: { from: '0x1', to: '0x2', value: '0x0' },
      } as unknown as TransactionMeta),
    ).toStrictEqual({
      amount: '+$10.25',
      isSuccessColor: true,
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
      }).format(
        new Date(Date.UTC(2025, 6, 9, 14, 56)),
      )} at ${new Intl.DateTimeFormat('en-US', {
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
    expect(shortenMoneyActivityHex('0x123456789')).toBe('0x123456789');
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

describe('getMoneyActivityAsset', () => {
  it('returns the MetaMask Pay token for a crypto deposit', () => {
    expect(
      getMoneyActivityAsset({
        ...findMock('money-tx-deposited'),
        metamaskPay: {
          tokenAddress: USDC_ADDRESS,
          chainId: MAINNET_CHAIN_ID,
        },
      } as TransactionMeta),
    ).toStrictEqual({
      chainId: MAINNET_CHAIN_ID,
      tokenAddress: USDC_ADDRESS,
      symbol: undefined,
    });
  });

  it('returns the MetaMask Pay token for a conversion', () => {
    expect(
      getMoneyActivityAsset({
        ...findMock('money-tx-converted'),
        metamaskPay: {
          tokenAddress: USDC_ADDRESS,
          chainId: MAINNET_CHAIN_ID,
        },
      } as TransactionMeta),
    ).toStrictEqual({
      chainId: MAINNET_CHAIN_ID,
      tokenAddress: USDC_ADDRESS,
      symbol: undefined,
    });
  });

  it('returns the destination MetaMask Pay token for a post-quote withdrawal', () => {
    expect(
      getMoneyActivityAsset({
        ...findMock('money-tx-sent'),
        metamaskPay: {
          tokenAddress: USDC_ADDRESS,
          chainId: MAINNET_CHAIN_ID,
          isPostQuote: true,
        },
      } as TransactionMeta),
    ).toStrictEqual({
      chainId: MAINNET_CHAIN_ID,
      tokenAddress: USDC_ADDRESS,
      symbol: undefined,
    });
  });

  it('skips the fiat deposit pay token and uses transfer metadata', () => {
    const deposited = findMock('money-tx-deposited');
    expect(
      getMoneyActivityAsset({
        ...deposited,
        metamaskPay: {
          tokenAddress: USDC_ADDRESS,
          chainId: MAINNET_CHAIN_ID,
          fiat: {
            orderId: '/providers/transak/orders/abc',
            provider: 'transak-native',
          },
        },
      } as TransactionMeta),
    ).toStrictEqual({
      chainId: deposited.chainId,
      tokenAddress: deposited.transferInformation?.contractAddress,
      symbol: MUSD_TOKEN.symbol,
    });
  });

  it('returns the transferred mUSD token for an incoming transfer', () => {
    const received = findMock('money-tx-received');
    expect(getMoneyActivityAsset(received)).toStrictEqual({
      chainId: received.chainId,
      tokenAddress: received.transferInformation?.contractAddress,
      symbol: MUSD_TOKEN.symbol,
    });
  });

  it('falls back to mUSD when pay and transfer metadata are missing', () => {
    expect(
      getMoneyActivityAsset({
        id: 'bare-tx',
        chainId: '0x8f',
        status: TransactionStatus.confirmed,
        type: TransactionType.moneyAccountDeposit,
        txParams: { from: '0x1', to: '0x2', value: '0x0' },
      } as unknown as TransactionMeta),
    ).toStrictEqual({
      chainId: '0x8f',
      tokenAddress: MUSD_TOKEN_ADDRESS,
      symbol: MUSD_TOKEN.symbol,
    });
  });
});
