import {
  getNativeTokenAddress,
  type Asset,
  type CurrencyRateState,
  type TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { getTokenSortValue } from './useTokenSortValues';

const marketData = (data: object) =>
  data as TokenRatesControllerState['marketData'];
const currencyRates = (data: object) =>
  data as CurrencyRateState['currencyRates'];
const eth = {
  chainId: '0x1',
  symbol: 'ETH',
  isNative: true,
  name: 'Ethereum',
} as unknown as Asset;

describe('getTokenSortValue', () => {
  it('returns no price when currency rate checks are off', () => {
    const price = getTokenSortValue(eth, 'price', {
      marketData: undefined,
      currencyRates: currencyRates({ ETH: { conversionRate: 1800 } }),
      conversionRates: undefined,
      useCurrencyRateCheck: false,
    });

    expect(price).toBeUndefined();
  });

  it('returns the cached price when currency rate checks are on', () => {
    const price = getTokenSortValue(eth, 'price', {
      marketData: undefined,
      currencyRates: currencyRates({ ETH: { conversionRate: 1800 } }),
      conversionRates: undefined,
      useCurrencyRateCheck: true,
    });

    expect(price).toBe(1800);
  });

  it('returns no price when the cached price is not finite', () => {
    const price = getTokenSortValue(eth, 'price', {
      marketData: undefined,
      currencyRates: currencyRates({
        ETH: { conversionRate: Number.POSITIVE_INFINITY },
      }),
      conversionRates: undefined,
      useCurrencyRateCheck: true,
    });

    expect(price).toBeUndefined();
  });

  it('returns no 24h change when the cached change is not finite', () => {
    const nativeAddress = getNativeTokenAddress('0x1' as Hex);
    const change = getTokenSortValue(eth, 'change', {
      marketData: marketData({
        '0x1': {
          [nativeAddress]: { pricePercentChange1d: Number.NaN },
        },
      }),
      currencyRates: undefined,
      conversionRates: undefined,
      useCurrencyRateCheck: true,
    });

    expect(change).toBeUndefined();
  });

  it('returns the cached 24h change', () => {
    const nativeAddress = getNativeTokenAddress('0x1' as Hex);
    const change = getTokenSortValue(eth, 'change', {
      marketData: marketData({
        '0x1': {
          [nativeAddress]: { pricePercentChange1d: -3 },
        },
      }),
      currencyRates: undefined,
      conversionRates: undefined,
      useCurrencyRateCheck: false,
    });

    expect(change).toBe(-3);
  });
});
