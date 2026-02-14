import { getTransferAmounts } from './transformations';

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
  }) as Parameters<typeof getTransferAmounts>[1];

describe('getTransferAmounts', () => {
  it('returns from when account is the sender', () => {
    const result = getTransferAmounts(account, makeTx([makeTransfer()]));
    expect(result.from).toStrictEqual({
      amount: -1000000000000000000n,
      decimal: 18,
      symbol: 'ETH',
    });
    expect(result.to).toBeUndefined();
  });

  it('returns to when account is the receiver', () => {
    const result = getTransferAmounts(
      account,
      makeTx([makeTransfer({ from: '0x9999', to: account })]),
    );
    expect(result.to).toStrictEqual({
      amount: 1000000000000000000n,
      decimal: 18,
      symbol: 'ETH',
    });
    expect(result.from).toBeUndefined();
  });

  it('returns both from and to for swaps', () => {
    const result = getTransferAmounts(
      account,
      makeTx([
        makeTransfer({ from: account, to: '0x9999' }),
        makeTransfer({
          from: '0x9999',
          to: account,
          amount: '500000',
          decimal: 6,
          symbol: 'USDC',
        }),
      ]),
    );
    expect(result.from).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.to).toStrictEqual({
      amount: 500000n,
      decimal: 6,
      symbol: 'USDC',
    });
  });

  it('takes only the first matching transfer per direction', () => {
    const result = getTransferAmounts(
      account,
      makeTx([
        makeTransfer({ from: account, amount: '100' }),
        makeTransfer({ from: account, amount: '999' }),
      ]),
    );
    expect((result.from as { amount: bigint }).amount).toBe(-100n);
  });

  it('matches addresses case-insensitively', () => {
    const result = getTransferAmounts(
      account.toLowerCase(),
      makeTx([makeTransfer({ from: account.toUpperCase() })]),
    );
    expect(result.from).toBeDefined();
  });

  it('falls back to native symbol when transfer has no symbol', () => {
    const result = getTransferAmounts(
      account,
      makeTx([makeTransfer({ symbol: undefined })]),
    );
    expect((result.from as { symbol: string }).symbol).toBe('ETH');
  });

  it('returns empty object when no transfers match', () => {
    const result = getTransferAmounts(
      account,
      makeTx([makeTransfer({ from: '0xaaaa', to: '0xbbbb' })]),
    );
    expect(result).toStrictEqual({});
  });
});
