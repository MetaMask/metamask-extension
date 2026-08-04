import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import type { Token } from '../multichain/types';
import {
  applyDisplaySign,
  calculateFiatFromMarketRates,
  getHumanReadableTokenAmount,
  getDisplaySignPrefix,
  getTokenAddressForMarketRates,
  toMarketRateLookupToken,
} from './fiat';

const ethToken: Token = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  chainId: '0x1',
};

describe('calculateFiatFromMarketRates', () => {
  const marketRates = {
    1: { [NATIVE_TOKEN_ADDRESS]: 2500 },
  };

  it('returns fiat amount for a valid token and amount', () => {
    expect(calculateFiatFromMarketRates('1.5', ethToken, marketRates)).toBe(
      3750,
    );
  });

  it('preserves sign for negative amounts', () => {
    expect(calculateFiatFromMarketRates('-1', ethToken, marketRates)).toBe(
      -2500,
    );
  });

  it('parses leading plus amounts', () => {
    expect(calculateFiatFromMarketRates('+1.5', ethToken, marketRates)).toBe(
      3750,
    );
  });

  it('returns undefined when amount, token, or rate is missing', () => {
    expect(
      calculateFiatFromMarketRates(undefined, ethToken, marketRates),
    ).toBeUndefined();
    expect(calculateFiatFromMarketRates('1', undefined, marketRates)).toBe(
      undefined,
    );
    expect(
      calculateFiatFromMarketRates('1', ethToken, { 1: {} }),
    ).toBeUndefined();
  });
});

describe('getHumanReadableTokenAmount', () => {
  it('returns an unsigned human-readable amount', () => {
    expect(
      getHumanReadableTokenAmount({
        amount: '1000000000000000000',
        decimals: 18,
        direction: 'out',
        symbol: 'ETH',
      }),
    ).toBe('1');
  });
});

describe('getDisplaySignPrefix', () => {
  it('returns no prefix for incoming amounts when plus is disabled', () => {
    expect(getDisplaySignPrefix('in', { showPlus: false })).toBe('');
  });
});

describe('applyDisplaySign', () => {
  describe('when signPrefix is "+"', () => {
    it('prepends + when the formatted string has no leading sign', () => {
      expect(applyDisplaySign('$2,500.00', '+')).toBe('+$2,500.00');
    });

    it('returns the string unchanged when it already starts with +', () => {
      expect(applyDisplaySign('+$2,500.00', '+')).toBe('+$2,500.00');
    });

    it('returns the string unchanged when it already starts with -', () => {
      expect(applyDisplaySign('-$2,500.00', '+')).toBe('-$2,500.00');
    });
  });

  describe('when signPrefix is "-"', () => {
    it('prepends - when the formatted string has no leading sign', () => {
      expect(applyDisplaySign('1.5 ETH', '-')).toBe('-1.5 ETH');
    });

    it('returns the string unchanged when it already starts with -', () => {
      expect(applyDisplaySign('-$2,500.00', '-')).toBe('-$2,500.00');
    });

    it('returns the string unchanged when it already starts with +', () => {
      expect(applyDisplaySign('+$2,500.00', '-')).toBe('+$2,500.00');
    });
  });

  describe('when signPrefix is empty', () => {
    it('returns the formatted string unchanged', () => {
      expect(applyDisplaySign('1.5 ETH', '')).toBe('1.5 ETH');
      expect(applyDisplaySign('-$2,500.00', '')).toBe('-$2,500.00');
    });
  });
});

describe('getTokenAddressForMarketRates', () => {
  it('maps native asset ids to the native token address', () => {
    expect(getTokenAddressForMarketRates('eip155:1/slip44:60')).toBe(
      NATIVE_TOKEN_ADDRESS,
    );
  });

  it('maps erc20 asset ids to contract addresses', () => {
    expect(
      getTokenAddressForMarketRates(
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ),
    ).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });
});

describe('toMarketRateLookupToken', () => {
  it('builds a market rate lookup token from activity token amounts', () => {
    expect(
      toMarketRateLookupToken(
        {
          amount: '1',
          decimals: 18,
          direction: 'out',
          symbol: 'ETH',
          assetId: 'eip155:1/slip44:60',
        },
        '0x1',
      ),
    ).toStrictEqual(ethToken);
  });
});
