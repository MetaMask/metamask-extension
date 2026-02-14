import { getTransferAmount } from './helpers';

describe('getTransferAmount', () => {
  it('prefers from over to when both exist', () => {
    const result = getTransferAmount({
      from: { amount: 2000000000000000000n, decimal: 18, symbol: 'ETH' },
      to: { amount: 3000000000n, decimal: 6, symbol: 'USDC' },
    });
    expect(result).toStrictEqual({ amount: '-2', symbol: 'ETH' });
  });

  it('negates the from amount', () => {
    const result = getTransferAmount({
      from: { amount: 1000000000000000000n, decimal: 18, symbol: 'ETH' },
    });
    expect(result).toStrictEqual({ amount: '-1', symbol: 'ETH' });
  });

  it('keeps already-negative from amounts as negative', () => {
    const result = getTransferAmount({
      from: { amount: -500000000000000000n, decimal: 18, symbol: 'ETH' },
    });
    expect(result).toStrictEqual({ amount: '-0.5', symbol: 'ETH' });
  });

  it('returns empty object when no amounts provided', () => {
    expect(getTransferAmount({})).toStrictEqual({});
  });

  it('returns empty object when fields are undefined', () => {
    const result = getTransferAmount({
      from: { amount: undefined, decimal: undefined } as any,
    });
    expect(result).toStrictEqual({});
  });
});
