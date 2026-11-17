import type { TokenWithFiatAmount } from '../types';
import { getDustTokenKey, sumDustFiatAmount } from './sum-dust-fiat';

const token = (
  tokenFiatAmount: number | null | undefined,
  symbol = 'DUST',
): TokenWithFiatAmount =>
  ({
    chainId: '0x1',
    address: '0xabc',
    symbol,
    title: symbol,
    decimals: 18,
    image: '',
    secondary: null,
    tokenFiatAmount,
  }) as TokenWithFiatAmount;

describe('sumDustFiatAmount', () => {
  it('sums finite fiat amounts', () => {
    expect(sumDustFiatAmount([token(1.25), token(0.5)])).toBe(1.75);
  });

  it('skips missing and non-finite amounts', () => {
    expect(
      sumDustFiatAmount([
        token(null),
        token(undefined),
        token(Number.NaN),
        token(0.2),
      ]),
    ).toBe(0.2);
  });
});

describe('getDustTokenKey', () => {
  it('keys a token by chain and lowercased address', () => {
    expect(
      getDustTokenKey({
        chainId: '0x1',
        address: '0xABC',
      }),
    ).toBe('0x1:0xabc');
  });
});
