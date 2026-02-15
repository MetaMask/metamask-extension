import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import type { Token } from '../../../../shared/lib/multichain/types';
import { getPrimaryAmount, calculateFiatFromMarketRates } from './helpers';

const ethToken: Token = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  chainId: '0x1',
};

const usdcToken: Token = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  decimals: 6,
  chainId: '0x1',
};

describe('getPrimaryAmount', () => {
  it('prefers from over to when both exist', () => {
    const result = getPrimaryAmount({
      from: { token: ethToken, amount: 2000000000000000000n },
      to: { token: usdcToken, amount: 3000000000n },
    });
    expect(result).toStrictEqual({
      amount: '-2',
      token: ethToken,
    });
  });

  it('negates the from amount', () => {
    const result = getPrimaryAmount({
      from: { token: ethToken, amount: 1000000000000000000n },
    });
    expect(result).toStrictEqual({
      amount: '-1',
      token: ethToken,
    });
  });

  it('keeps already-negative from amounts as negative', () => {
    const result = getPrimaryAmount({
      from: { token: ethToken, amount: -500000000000000000n },
    });
    expect(result).toStrictEqual({
      amount: '-0.5',
      token: ethToken,
    });
  });

  it('returns empty object when no amounts provided', () => {
    expect(getPrimaryAmount({})).toStrictEqual({});
  });
});

describe('calculateFiatFromMarketRates', () => {
  const marketRates = {
    1: { [NATIVE_TOKEN_ADDRESS]: 2500 },
  };

  it('returns fiat amount for a valid token and amount', () => {
    const result = calculateFiatFromMarketRates('1.5', ethToken, marketRates);
    expect(result).toBe(3750);
  });

  it('uses absolute value of negative amounts', () => {
    const result = calculateFiatFromMarketRates('-1', ethToken, marketRates);
    expect(result).toBe(2500);
  });

  it('returns null when amount is undefined', () => {
    expect(
      calculateFiatFromMarketRates(undefined, ethToken, marketRates),
    ).toBeNull();
  });

  it('returns null when token is undefined', () => {
    expect(
      calculateFiatFromMarketRates('1', undefined, marketRates),
    ).toBeNull();
  });

  it('returns null when amount is zero', () => {
    expect(calculateFiatFromMarketRates('0', ethToken, marketRates)).toBeNull();
  });

  it('returns null when no rate exists for the token', () => {
    expect(
      calculateFiatFromMarketRates('1', usdcToken, marketRates),
    ).toBeNull();
  });
});
