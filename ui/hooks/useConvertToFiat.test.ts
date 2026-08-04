import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import type { CaipChainId, Hex } from '@metamask/utils';
import { useConvertToFiat } from './useConvertToFiat';

const solAssetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const solChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId;
const fakeSolSplAssetId =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:So11111111111111111111111111111111111111112';
const usdcAssetId =
  'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

jest.mock('../selectors/assets', () => ({
  getAssetsPrice: (state: {
    metamask: { assetsPrice: Record<string, unknown> };
  }) => state.metamask.assetsPrice,
  getAssetsRates: (state: {
    metamask: { conversionRates: Record<string, unknown> };
  }) => state.metamask.conversionRates,
}));

jest.mock('../ducks/metamask/metamask', () => ({
  getCurrencyRates: (state: {
    metamask: { currencyRates: Record<string, unknown> };
  }) => state.metamask.currencyRates,
}));

jest.mock('../selectors/activity', () => {
  const emptyMarketRates = {};
  return { selectMarketRates: () => emptyMarketRates };
});

jest.mock('../selectors/multichain', () => ({
  getMultichainShouldShowFiat: () => true,
}));

jest.mock('../selectors', () => ({
  getUseCurrencyRateCheck: (state: {
    metamask: { useCurrencyRateCheck?: boolean };
  }) => state.metamask.useCurrencyRateCheck ?? true,
  getShowFiatInTestnets: () => false,
}));

function renderHookWithState(
  state: {
    metamask: {
      useCurrencyRateCheck?: boolean;
      assetsPrice: Record<string, { assetPriceType?: string; price?: number }>;
      conversionRates: Record<string, { rate?: string | number }>;
      currencyRates: Record<string, { conversionRate?: number }>;
    };
  },
  chainId?: Hex | CaipChainId,
) {
  const store = configureMockStore()(state);
  return renderHook(() => useConvertToFiat(chainId), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store, children }),
  });
}

describe('useConvertToFiat', () => {
  it('converts Solana sends to a fiat value', () => {
    const { result } = renderHookWithState(
      {
        metamask: {
          useCurrencyRateCheck: true,
          assetsPrice: {
            [solAssetId]: { assetPriceType: 'fungible', price: 150 },
          },
          conversionRates: {},
          currencyRates: {},
        },
      },
      solChainId,
    );

    expect(
      result.current({
        amount: '0.005',
        symbol: 'SOL',
        assetId: solAssetId,
        direction: 'out',
      }),
    ).toBe(0.75);
  });

  it('skips zero assetsPrice and falls through for EVM tokens', () => {
    const { result } = renderHookWithState({
      metamask: {
        assetsPrice: {
          [usdcAssetId]: { assetPriceType: 'fungible', price: 0 },
        },
        conversionRates: {
          [usdcAssetId]: { rate: 1 },
        },
        currencyRates: {},
      },
    });

    expect(
      result.current({
        amount: '1',
        symbol: 'USDC',
        assetId: usdcAssetId,
        decimals: 0,
        direction: 'out',
      }),
    ).toBe(1);
  });

  it('does not use currencyRates by symbol for EVM tokens', () => {
    const { result } = renderHookWithState({
      metamask: {
        assetsPrice: {},
        conversionRates: {},
        currencyRates: {
          ETH: { conversionRate: 3000 },
        },
      },
    });

    expect(
      result.current({
        amount: '1',
        symbol: 'ETH',
        assetId: 'eip155:1/erc20:0x1111111111111111111111111111111111111111',
        decimals: 0,
        direction: 'out',
      }),
    ).toBeUndefined();
  });

  it('uses currencyRates for non-EVM natives when higher sources miss', () => {
    const { result } = renderHookWithState(
      {
        metamask: {
          assetsPrice: {},
          conversionRates: {},
          currencyRates: {
            SOL: { conversionRate: 150 },
          },
        },
      },
      solChainId,
    );

    expect(
      result.current({
        amount: '2',
        symbol: 'SOL',
        assetId: solAssetId,
        direction: 'out',
      }),
    ).toBe(300);
  });

  it('does not use currencyRates by symbol for non-native non-EVM tokens', () => {
    const { result } = renderHookWithState(
      {
        metamask: {
          assetsPrice: {},
          conversionRates: {},
          currencyRates: {
            SOL: { conversionRate: 150 },
          },
        },
      },
      solChainId,
    );

    expect(
      result.current({
        amount: '2',
        symbol: 'SOL',
        assetId: fakeSolSplAssetId,
        direction: 'out',
      }),
    ).toBeUndefined();
  });

  it('returns undefined when currency rate check is disabled for non-EVM', () => {
    const { result } = renderHookWithState(
      {
        metamask: {
          useCurrencyRateCheck: false,
          assetsPrice: {
            [solAssetId]: { assetPriceType: 'fungible', price: 150 },
          },
          conversionRates: {},
          currencyRates: {},
        },
      },
      solChainId,
    );

    expect(
      result.current({
        amount: '0.005',
        symbol: 'SOL',
        assetId: solAssetId,
        direction: 'out',
      }),
    ).toBeUndefined();
  });
});
