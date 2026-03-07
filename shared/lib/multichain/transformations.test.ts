import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import { parseValueTransfers } from './transformations';

const account = '0xABCDef0123456789abcdef0123456789ABCDEF00';

const makeTransfer = (overrides: Record<string, unknown> = {}) => ({
  amount: '1000000000000000000',
  decimal: 18,
  symbol: 'ETH',
  from: account,
  to: '0x1111111111111111111111111111111111111111',
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
