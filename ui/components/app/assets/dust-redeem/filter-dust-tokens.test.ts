import type { CaipChainId } from '@metamask/utils';
import { MUSD_TOKEN_ADDRESS } from '../../musd/constants';
import type { TokenWithFiatAmount } from '../types';
import { filterDustTokens, getDustFiatThreshold } from './filter-dust-tokens';

const createToken = (
  symbol: string,
  tokenFiatAmount: number | null,
  overrides: Partial<TokenWithFiatAmount> = {},
): TokenWithFiatAmount =>
  ({
    chainId: '0x1',
    address: `0x${symbol}`,
    symbol,
    title: symbol,
    decimals: 18,
    image: '',
    balance: '1',
    secondary: null,
    tokenFiatAmount,
    ...overrides,
  }) as TokenWithFiatAmount;

const rate = (
  conversionRate: number | null,
  usdConversionRate: number | null,
) => ({
  conversionDate: null,
  conversionRate,
  usdConversionRate,
});

describe('getDustFiatThreshold', () => {
  it('converts a USD ceiling into the display currency', () => {
    expect(
      getDustFiatThreshold(5, {
        ETH: rate(2, 1),
      }),
    ).toBe(10);
  });

  it('keeps the USD ceiling when the rate cannot convert', () => {
    expect(getDustFiatThreshold(5, { ETH: rate(556.12, null) })).toBe(5);
  });
});

describe('filterDustTokens', () => {
  const tokens = [
    createToken('DUST', 0.25),
    createToken('MID', 3),
    createToken('HIGH', 8),
    createToken('BIG', 20),
    createToken('UNKNOWN', null),
    createToken('ETH', 3, {
      isNative: true,
      chainId: '0xa4b1',
      address: '0x0000000000000000000000000000000000000000',
    }),
    createToken('SOL', 0.4, {
      isNative: true,
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId,
    }),
    createToken('mUSD', 0.4, { address: MUSD_TOKEN_ADDRESS }),
    createToken('EMPTY', 0.1, { balance: '0' }),
    createToken('UNPRICED_EMPTY', null, { balance: '0' }),
  ];

  const filter = (
    thresholdUsd: number,
    includeGasTokens = false,
    currencyRates?: Parameters<typeof getDustFiatThreshold>[1],
  ) =>
    filterDustTokens(tokens, {
      thresholdUsd,
      includeGasTokens,
      currencyRates,
    }).map((token) => token.symbol);

  it('keeps EVM tokens under $1, plus unpriced tokens', () => {
    expect(filter(1)).toEqual(['DUST', 'UNKNOWN']);
  });

  it('widens the list for the $5 and $10 ceilings', () => {
    expect(filter(5)).toEqual(['DUST', 'MID', 'UNKNOWN']);
    expect(filter(10)).toEqual(['DUST', 'MID', 'HIGH', 'UNKNOWN']);
  });

  it('adds EVM gas tokens under the ceiling only when requested', () => {
    expect(filter(5)).not.toContain('ETH');
    expect(filter(5, true)).toEqual(['DUST', 'MID', 'UNKNOWN', 'ETH']);
    expect(filter(1, true)).not.toContain('ETH');
  });

  it('leaves zero-balance tokens out at every ceiling', () => {
    expect(filter(1)).not.toContain('EMPTY');
    expect(filter(10, true)).not.toContain('EMPTY');
    expect(filter(10, true)).not.toContain('UNPRICED_EMPTY');
  });

  it('leaves non-EVM tokens out', () => {
    expect(filter(10, true)).not.toContain('SOL');
  });

  it('uses the display-currency ceiling', () => {
    expect(
      filter(1, false, {
        ETH: rate(4, 1),
      }),
    ).toEqual(['DUST', 'MID', 'UNKNOWN']);
  });
});
