import {
  oldestRawActivityTime,
  parseAccountsApiActivity,
} from './accounts-api';

const MONEY_ADDRESS = '0xbF4bC559f929cE3994Ba12D71d564737357bC8C2';
const SETTLEMENT_ADDRESS = '0x8dFE562Cbb4E93D5029f39DA26BB6B501a8d1D3e';
const REWARDER_ADDRESS = '0xfe80eea4249a1f01095d35e0cf4f37367976a9f0';
const CASHBACK_MULTISEND_TO = '0xC7f1b2228fbf28451c7bf791C4f610111f0f32cb';

const cardPaymentRow = {
  hash: '0x2b45bda071d8feff265c541e251a5e035e5f55270f8ad288dcd80f6740793847',
  timestamp: '2026-06-04T11:53:51.000Z',
  chainId: 143,
  from: '0x1905d0a43340c81b94468e7dfa5f341ff47ae6a5',
  to: '0x40a695a16c213afef1c87fd471fb73157b948f3f',
  isError: false,
  transactionType: 'METAMASK_CARD_PAYMENT',
  valueTransfers: [
    {
      from: MONEY_ADDRESS.toLowerCase(),
      to: SETTLEMENT_ADDRESS.toLowerCase(),
      amount: '5381986',
      decimal: 6,
      contractAddress: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
      symbol: 'mUSD',
    },
  ],
};

const cashbackRow = {
  hash: '0x9c3aa0a1f1f4a8c2d3e4f5061728394a5b6c7d8e9f00112233445566778899aa',
  timestamp: '2026-06-04T12:10:00.000Z',
  chainId: 143,
  from: REWARDER_ADDRESS,
  to: MONEY_ADDRESS.toLowerCase(),
  isError: false,
  transactionType: 'METAMASK_CARD_CASHBACK',
  valueTransfers: [
    {
      from: REWARDER_ADDRESS,
      to: MONEY_ADDRESS.toLowerCase(),
      amount: '300000',
      decimal: 6,
      contractAddress: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
      symbol: 'mUSD',
    },
  ],
};

const unclassifiedCashbackRow = {
  hash: '0x126be466696f2e3d124c97dedd7a6abd02e31883f544e92f80de732d566b9b16',
  timestamp: '2026-06-22T21:41:12.000Z',
  chainId: 143,
  from: '0xb978703B01a60c7fbD4541D6c29299C65C8e61EA',
  to: CASHBACK_MULTISEND_TO,
  isError: false,
  methodId: '0x0d49b711',
  transactionType: 'GENERIC_CONTRACT_CALL',
  valueTransfers: [
    {
      from: '0x21607d4c8cf71844955889890c1711655fd08d72',
      to: MONEY_ADDRESS.toLowerCase(),
      amount: '999454',
      decimal: 6,
      contractAddress: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
      symbol: 'mUSD',
    },
  ],
};

const inboundTopUpRow = {
  hash: '0x1219eae581c3f3ff44cace3ec51b91c31fa15aecbff612d8bcd058128990e710',
  timestamp: '2026-06-04T11:42:02.000Z',
  chainId: 143,
  from: '0xb42f812a44c22cc6b861478900401ee759ebead6',
  to: '0xdb9b1e94b5b69df7e401ddbede43491141047db3',
  isError: false,
  transactionType: 'GENERIC_CONTRACT_CALL',
  valueTransfers: [
    {
      from: '0xfe80eea4249a1f01095d35e0cf4f37367976a9f0',
      to: MONEY_ADDRESS.toLowerCase(),
      amount: '9910542',
      decimal: 6,
      contractAddress: '0x754704bc059f8c67012fed69bc8a327a5aafb603',
      symbol: 'USDC',
    },
  ],
};

describe('parseAccountsApiActivity', () => {
  it('maps a card payment to a card outflow keyed on the leg leaving the money account', () => {
    const result = parseAccountsApiActivity(
      { data: [cardPaymentRow, inboundTopUpRow] },
      MONEY_ADDRESS,
    );

    expect(result).toStrictEqual([
      {
        kind: 'card',
        hash: cardPaymentRow.hash,
        time: Date.parse('2026-06-04T11:53:51.000Z'),
        chainId: '0x8f',
        token: {
          address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
          symbol: 'mUSD',
          decimals: 6,
        },
        amount: '5381986',
        paidTo: SETTLEMENT_ADDRESS.toLowerCase(),
      },
    ]);
  });

  it('maps a cashback row to a cashback inflow', () => {
    const result = parseAccountsApiActivity(
      { data: [cashbackRow, inboundTopUpRow] },
      MONEY_ADDRESS,
    );

    expect(result).toStrictEqual([
      {
        kind: 'cashback',
        hash: cashbackRow.hash,
        time: Date.parse('2026-06-04T12:10:00.000Z'),
        chainId: '0x8f',
        token: {
          address: '0xaca92e438df0b2401ff60da7e4337b687a2435da',
          symbol: 'mUSD',
          decimals: 6,
        },
        amount: '300000',
        receivedFrom: REWARDER_ADDRESS,
      },
    ]);
  });

  it('maps an unclassified Baanx multisend payout to cashback', () => {
    const result = parseAccountsApiActivity(
      { data: [unclassifiedCashbackRow] },
      MONEY_ADDRESS,
    );

    expect(result).toStrictEqual([
      expect.objectContaining({
        kind: 'cashback',
        hash: unclassifiedCashbackRow.hash,
        amount: '999454',
      }),
    ]);
  });

  it('maps a reversed card payment to a refund', () => {
    const result = parseAccountsApiActivity(
      {
        data: [
          {
            ...cardPaymentRow,
            valueTransfers: [
              {
                ...cardPaymentRow.valueTransfers[0],
                from: SETTLEMENT_ADDRESS.toLowerCase(),
                to: MONEY_ADDRESS.toLowerCase(),
              },
            ],
          },
        ],
      },
      MONEY_ADDRESS,
    );

    expect(result).toStrictEqual([
      expect.objectContaining({
        kind: 'refund',
        hash: cardPaymentRow.hash,
        amount: '5381986',
      }),
    ]);
  });

  it('drops rows whose chainId is not Monad', () => {
    expect(
      parseAccountsApiActivity(
        {
          data: [
            { ...cardPaymentRow, chainId: 1 },
            { ...cashbackRow, chainId: 1 },
          ],
        },
        MONEY_ADDRESS,
      ),
    ).toStrictEqual([]);
  });

  it('drops malformed rows without throwing', () => {
    expect(
      parseAccountsApiActivity(
        {
          data: [
            { ...cardPaymentRow, valueTransfers: [] },
            { ...cashbackRow, timestamp: 'not-a-date' },
          ],
        },
        MONEY_ADDRESS,
      ),
    ).toStrictEqual([]);
  });
});

describe('oldestRawActivityTime', () => {
  const page = (...timestamps: string[]) => ({
    data: timestamps.map((timestamp) => ({ timestamp })),
  });

  it('returns +Infinity when no pages have been fetched', () => {
    expect(oldestRawActivityTime([])).toBe(Number.POSITIVE_INFINITY);
  });

  it('returns the oldest raw timestamp across every page', () => {
    const oldest = '2026-06-01T00:00:00.000Z';
    expect(
      oldestRawActivityTime([
        page('2026-06-04T00:00:00.000Z', '2026-06-03T00:00:00.000Z'),
        page(oldest, '2026-06-02T00:00:00.000Z'),
      ]),
    ).toBe(new Date(oldest).getTime());
  });
});
