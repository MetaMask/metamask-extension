import {
  getNativeTokenAddress,
  type Asset,
  type CurrencyRateState,
  type MultichainAssetsRatesControllerState,
  type TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import {
  getCachedPercentChange,
  getCachedSpotPrice,
  getCachedTokenPrice,
  getCachedTokenPercentChange,
} from './token-price';

const marketData = (data: object) =>
  data as TokenRatesControllerState['marketData'];
const currencyRates = (data: object) =>
  data as CurrencyRateState['currencyRates'];
const conversionRates = (data: object) =>
  data as MultichainAssetsRatesControllerState['conversionRates'];

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

describe('getCachedSpotPrice', () => {
  it('uses the currency rate for a native token', () => {
    const price = getCachedSpotPrice({
      isNative: true,
      symbol: 'ETH',
      chainId: '0x1',
      currencyRates: currencyRates({ ETH: { conversionRate: 1800 } }),
    });

    expect(price).toBe(1800);
  });

  it('multiplies an EVM token market price by the currency rate', () => {
    const price = getCachedSpotPrice({
      isNative: false,
      symbol: 'USDC',
      chainId: '0x1',
      address: USDC_ADDRESS.toLowerCase(),
      marketData: marketData({
        '0x1': {
          [USDC_ADDRESS]: { price: 0.0005, currency: 'ETH' },
        },
      }),
      currencyRates: currencyRates({ ETH: { conversionRate: 2000 } }),
    });

    expect(price).toBe(1);
  });

  it('returns undefined when an EVM token has no market data', () => {
    const price = getCachedSpotPrice({
      isNative: false,
      symbol: 'USDC',
      chainId: '0x1',
      address: USDC_ADDRESS,
    });

    expect(price).toBeUndefined();
  });

  it('parses a non-EVM conversion rate', () => {
    const assetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
    const price = getCachedSpotPrice({
      isNative: true,
      symbol: 'SOL',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      conversionRates: conversionRates({ [assetId]: { rate: '150.25' } }),
    });

    expect(price).toBe(150.25);
  });

  it('returns undefined for a non-finite price', () => {
    expect(
      getCachedSpotPrice({
        isNative: true,
        symbol: 'ETH',
        chainId: '0x1',
        currencyRates: currencyRates({ ETH: { conversionRate: Number.NaN } }),
      }),
    ).toBeUndefined();

    expect(
      getCachedSpotPrice({
        isNative: false,
        symbol: 'USDC',
        chainId: '0x1',
        address: USDC_ADDRESS,
        marketData: marketData({
          '0x1': {
            [USDC_ADDRESS]: {
              price: Number.POSITIVE_INFINITY,
              currency: 'usd',
            },
          },
        }),
        currencyRates: currencyRates({ usd: { conversionRate: 1 } }),
      }),
    ).toBeUndefined();
  });
});

describe('getCachedTokenPrice', () => {
  it('prices an EVM token from the list asset address', () => {
    const asset = {
      chainId: '0x1',
      symbol: 'USDC',
      isNative: false,
      address: USDC_ADDRESS,
      assetId: USDC_ADDRESS,
    } as unknown as Asset;

    const price = getCachedTokenPrice(
      asset,
      marketData({
        '0x1': {
          [USDC_ADDRESS]: { price: 2, currency: 'usd' },
        },
      }),
      currencyRates({ usd: { conversionRate: 1 } }),
      undefined,
    );

    expect(price).toBe(2);
  });
});

describe('getCachedPercentChange', () => {
  it('reads an EVM token change from market data', () => {
    const change = getCachedPercentChange({
      isEvm: true,
      isNative: false,
      chainId: '0x1',
      address: USDC_ADDRESS.toLowerCase(),
      marketData: marketData({
        '0x1': {
          [USDC_ADDRESS]: { pricePercentChange1d: 1.5 },
        },
      }),
    });

    expect(change).toBe(1.5);
  });

  it('reads a native EVM change from the chain native token address', () => {
    const nativeAddress = getNativeTokenAddress('0x1' as Hex);
    const change = getCachedPercentChange({
      isEvm: true,
      isNative: true,
      chainId: '0x1',
      address: 'slip44:60',
      marketData: marketData({
        '0x1': {
          [nativeAddress]: { pricePercentChange1d: -3 },
        },
      }),
    });

    expect(change).toBe(-3);
  });

  it('reads a non-EVM change from the conversion rate', () => {
    const assetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
    const change = getCachedPercentChange({
      isEvm: false,
      isNative: true,
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      address: assetId,
      conversionRates: conversionRates({
        [assetId]: { marketData: { pricePercentChange: { P1D: 2.25 } } },
      }),
    });

    expect(change).toBe(2.25);
  });

  it('returns undefined for a non-finite change', () => {
    expect(
      getCachedPercentChange({
        isEvm: true,
        isNative: false,
        chainId: '0x1',
        address: USDC_ADDRESS,
        marketData: marketData({
          '0x1': {
            [USDC_ADDRESS]: { pricePercentChange1d: Number.NaN },
          },
        }),
      }),
    ).toBeUndefined();

    expect(
      getCachedPercentChange({
        isEvm: true,
        isNative: false,
        chainId: '0x1',
        address: USDC_ADDRESS,
        marketData: marketData({
          '0x1': {
            [USDC_ADDRESS]: {
              pricePercentChange1d: Number.POSITIVE_INFINITY,
            },
          },
        }),
      }),
    ).toBeUndefined();
  });

  it('returns undefined when the change is missing', () => {
    const change = getCachedPercentChange({
      isEvm: true,
      isNative: false,
      chainId: '0x1',
      address: USDC_ADDRESS,
    });

    expect(change).toBeUndefined();
  });
});

describe('getCachedTokenPercentChange', () => {
  it('reads the change for a list asset', () => {
    const asset = {
      chainId: '0x1',
      symbol: 'USDC',
      isNative: false,
      address: USDC_ADDRESS,
      assetId: USDC_ADDRESS,
    } as unknown as Asset;

    const change = getCachedTokenPercentChange(
      asset,
      marketData({
        '0x1': {
          [USDC_ADDRESS]: { pricePercentChange1d: 0.4 },
        },
      }),
      undefined,
    );

    expect(change).toBe(0.4);
  });
});
