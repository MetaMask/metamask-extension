import type { InfiniteData } from '@tanstack/react-query';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';
import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import { parseValueTransfers, selectTransactions } from './transformations';

const account = '0xAABBCCDDEE11223344556677889900AABBCCDD00';
const other = '0x00AABBCCDDEE112233445566778899AABBCCDDEE';

const makeTransfer = (overrides: Record<string, unknown> = {}) => ({
  amount: '1000000000000000000',
  decimal: 18,
  symbol: 'ETH',
  from: account,
  to: other,
  ...overrides,
});

const makeTx = (valueTransfers: Record<string, unknown>[] = []) =>
  ({
    chainId: 1,
    valueTransfers,
  }) as Parameters<typeof parseValueTransfers>[1];

describe('parseValueTransfers', () => {
  it('returns from when account is the sender', () => {
    const result = parseValueTransfers(account, makeTx([makeTransfer()]));
    expect(result.from).toStrictEqual({
      token: {
        address: NATIVE_TOKEN_ADDRESS,
        symbol: 'ETH',
        decimals: 18,
        chainId: '0x1',
      },
      amount: -1000000000000000000n,
    });
    expect(result.to).toBeUndefined();
  });

  it('returns to when account is the receiver', () => {
    const result = parseValueTransfers(
      account,
      makeTx([makeTransfer({ from: '0x9999', to: account })]),
    );
    expect(result.to).toStrictEqual({
      token: {
        address: NATIVE_TOKEN_ADDRESS,
        symbol: 'ETH',
        decimals: 18,
        chainId: '0x1',
      },
      amount: 1000000000000000000n,
    });
    expect(result.from).toBeUndefined();
  });

  it('returns both from and to for swaps', () => {
    const result = parseValueTransfers(
      account,
      makeTx([
        makeTransfer({ from: account, to: '0x9999' }),
        makeTransfer({
          from: '0x9999',
          to: account,
          amount: '500000',
          decimal: 6,
          symbol: 'USDC',
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        }),
      ]),
    );
    expect(result.from).toBeDefined();
    expect(result.to).toStrictEqual({
      token: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 6,
        chainId: '0x1',
      },
      amount: 500000n,
    });
  });

  it('takes only the first matching transfer per direction', () => {
    const result = parseValueTransfers(
      account,
      makeTx([
        makeTransfer({ from: account, amount: '100' }),
        makeTransfer({ from: account, amount: '999' }),
      ]),
    );
    expect(result.from?.amount).toBe(-100n);
  });

  it('matches addresses case-insensitively', () => {
    const result = parseValueTransfers(
      account.toLowerCase(),
      makeTx([makeTransfer({ from: account.toUpperCase() })]),
    );
    expect(result.from).toBeDefined();
  });

  it('falls back to native symbol when transfer has no symbol', () => {
    const result = parseValueTransfers(
      account,
      makeTx([makeTransfer({ symbol: undefined })]),
    );
    expect(result.from?.token.symbol).toBe('ETH');
  });

  it('uses contractAddress for token transfers', () => {
    const result = parseValueTransfers(
      account,
      makeTx([
        makeTransfer({
          contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        }),
      ]),
    );
    expect(result.from?.token.address).toBe(
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    );
  });

  it('defaults to NATIVE_TOKEN_ADDRESS when no contractAddress', () => {
    const result = parseValueTransfers(account, makeTx([makeTransfer()]));
    expect(result.from?.token.address).toBe(NATIVE_TOKEN_ADDRESS);
  });

  it('returns empty object when no transfers match', () => {
    const result = parseValueTransfers(
      account,
      makeTx([makeTransfer({ from: '0xaaaa', to: '0xbbbb' })]),
    );
    expect(result).toStrictEqual({});
  });
});

const baseRawTx = {
  hash: '0xabc',
  timestamp: '2025-01-01T00:00:00Z',
  chainId: 1,
  blockNumber: 100,
  blockHash: '0x0',
  gas: 21000,
  gasUsed: 21000,
  gasPrice: '1000000000',
  effectiveGasPrice: '1000000000',
  nonce: 0,
  cumulativeGasUsed: 21000,
  value: '1000000000000000000',
  methodId: '0x',
};

const createData = (rawTxs: Record<string, unknown>[]) => ({
  pageParams: [],
  pages: [
    {
      unprocessedNetworks: [],
      pageInfo: { count: rawTxs.length, hasNextPage: false },
      data: rawTxs as V4MultiAccountTransactionsResponse['data'],
    },
  ],
});

const nativeTransfer = (from: string, to: string) => ({
  from,
  to,
  amount: '1000000000000000000',
  decimal: 18,
  symbol: 'ETH',
  name: 'Ether',
  contractAddress: '',
  transferType: 'normal',
});

describe('selectTransactions', () => {
  it('shows outgoing native transfers initiated by the account', () => {
    const transform = selectTransactions({ address: account });
    const result = transform(
      createData([
        {
          ...baseRawTx,
          from: account,
          to: other,
          valueTransfers: [nativeTransfer(account, other)],
        },
      ]),
    );

    expect(result.pages[0].data).toHaveLength(1);
  });

  it('shows native self-sends', () => {
    const result = selectTransactions({ address: account })(
      createData([
        {
          ...baseRawTx,
          from: account,
          to: account,
          valueTransfers: [nativeTransfer(account, account)],
        },
      ]),
    );
    expect(result.pages[0].data).toHaveLength(1);
  });

  it('shows swaps where the account sends native and receives a token', () => {
    const router = '0x2222222222222222222222222222222222222222';
    const result = selectTransactions({ address: account })(
      createData([
        {
          ...baseRawTx,
          from: account,
          to: router,
          valueTransfers: [
            nativeTransfer(account, router),
            {
              from: router,
              to: account,
              amount: '500000',
              decimal: 6,
              symbol: 'USDC',
              name: 'USD Coin',
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              transferType: 'erc20',
            },
          ],
        },
      ]),
    );
    expect(result.pages[0].data).toHaveLength(1);
  });

  it('blocks incoming native transfers where the account is the recipient', () => {
    const result = selectTransactions({ address: account })(
      createData([
        {
          ...baseRawTx,
          from: other,
          to: account,
          valueTransfers: [nativeTransfer(other, account)],
        },
      ]),
    );
    expect(result.pages[0].data).toHaveLength(0);
  });

  it('blocks contract-initiated native receipt where account did not initiate', () => {
    const contract = '0x3333333333333333333333333333333333333333';
    const result = selectTransactions({ address: account })(
      createData([
        {
          ...baseRawTx,
          from: contract,
          to: account,
          value: '0',
          valueTransfers: [nativeTransfer(contract, account)],
        },
      ]),
    );
    expect(result.pages[0].data).toHaveLength(0);
  });
});
