import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Hex } from '@metamask/utils';
import type { Store } from 'redux';
import { MetaMaskTestReduxProvider } from '../../../../../test/lib/redux-test-provider';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import useTokenExchangeRate from './useTokenExchangeRate';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const ETH_RATE = 11.1;
const POL_RATE = 0.25;
const LAST_UPDATED = 1700000000000;

const USDT_GOERLI = 'eip155:5/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7';
const YFI_GOERLI = 'eip155:5/erc20:0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e';
const USDC_POLYGON =
  'eip155:137/erc20:0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

const defaultAssetsInfo = {
  ...mockState.metamask.assetsInfo,
  'eip155:1/slip44:60': { type: 'native', decimals: 18, symbol: 'ETH' },
  'eip155:5/slip44:60': { type: 'native', decimals: 18, symbol: 'ETH' },
  'eip155:137/slip44:60': { type: 'native', decimals: 18, symbol: 'POL' },
  [USDT_GOERLI]: { type: 'erc20', decimals: 6, symbol: 'USDT' },
  [YFI_GOERLI]: { type: 'erc20', decimals: 18, symbol: 'YFI' },
  [USDC_POLYGON]: { type: 'erc20', decimals: 6, symbol: 'USDC' },
};

const defaultAssetsPrice = {
  'eip155:1/slip44:60': {
    assetPriceType: 'fungible',
    price: ETH_RATE,
    usdPrice: ETH_RATE,
    lastUpdated: LAST_UPDATED,
  },
  'eip155:5/slip44:60': {
    assetPriceType: 'fungible',
    price: ETH_RATE,
    usdPrice: ETH_RATE,
    lastUpdated: LAST_UPDATED,
  },
  'eip155:137/slip44:60': {
    assetPriceType: 'fungible',
    price: POL_RATE,
    usdPrice: POL_RATE,
    lastUpdated: LAST_UPDATED,
  },
  // marketData price is in native units; assetsPrice stores fiat (= price * nativeRate)
  [USDT_GOERLI]: {
    assetPriceType: 'fungible',
    price: 0.5 * ETH_RATE,
    usdPrice: 0.5 * ETH_RATE,
    lastUpdated: LAST_UPDATED,
  },
  [YFI_GOERLI]: {
    assetPriceType: 'fungible',
    price: 3.304588 * ETH_RATE,
    usdPrice: 3.304588 * ETH_RATE,
    lastUpdated: LAST_UPDATED,
  },
  [USDC_POLYGON]: {
    assetPriceType: 'fungible',
    price: Number(POL_RATE),
    usdPrice: Number(POL_RATE),
    lastUpdated: LAST_UPDATED,
  },
};

const renderUseTokenExchangeRate = (
  tokenAddress?: string,
  metaMaskState?: Record<string, unknown>,
  overrideChainId?: Hex,
  options?: {
    store?: Store;
    queryClient?: QueryClient;
  },
) => {
  const store =
    options?.store ??
    configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        selectedCurrency: 'usd',
        assetsInfo: defaultAssetsInfo,
        assetsPrice: defaultAssetsPrice,
        ...metaMaskState,
      },
    });

  const queryClient = options?.queryClient ?? createQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MetaMaskTestReduxProvider store={store}>
        {children}
      </MetaMaskTestReduxProvider>
    </QueryClientProvider>
  );

  return {
    ...renderHook(() => useTokenExchangeRate(tokenAddress, overrideChainId), {
      wrapper,
    }),
    store,
    queryClient,
  };
};

jest.mock('../../../../helpers/utils/util', () => ({
  fetchTokenExchangeRates: jest.fn(),
}));

describe('useTokenExchangeRate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ERC-20: price is available', () => {
    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    );

    expect(String(exchangeRate?.value)).toEqual('5.55');
  });

  it('ERC-20: price is unavailable through state but available through API', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
      Promise.resolve({
        '0x0000000000000000000000000000000000000001': '2.34',
      }),
    );

    const { result } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    await waitFor(() => {
      expect(String(result.current?.value)).toBe('25.974');
    });
    expect(fetchTokenExchangeRates).toBeCalledTimes(1);
  });

  it('ERC-20: price is unavailable through state and through API', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
      Promise.resolve({
        'Not token': '2.34',
      }),
    );

    const { result } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    await waitFor(() => {
      expect(fetchTokenExchangeRates).toBeCalledTimes(1);
    });
    expect(result.current?.value).toBe(undefined);
  });

  it('ERC-20: price is unavailable through state but API call fails', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
      Promise.reject(new Error('error')),
    );

    const { result } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    await waitFor(() => {
      expect(fetchTokenExchangeRates).toBeCalledTimes(1);
    });
    expect(result.current?.value).toBe(undefined);
  });

  it('native: price is available', () => {
    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(undefined);

    expect(String(exchangeRate?.value)).toBe('11.1');
  });

  it('native: price is unavailable', () => {
    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(undefined, { assetsPrice: {} });

    expect(exchangeRate?.value).toBe(undefined);
  });

  describe('with overrideChainId', () => {
    it('ERC-20: returns price from override chain market data', () => {
      // Current chain is 0x5 (Goerli), but we request price for token on 0x89 (Polygon)
      const {
        result: { current: exchangeRate },
      } = renderUseTokenExchangeRate(
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        undefined,
        '0x89',
      );

      // price (1.0) * POL conversion rate (0.25) = 0.25
      expect(String(exchangeRate?.value)).toEqual('0.25');
    });

    it('ERC-20: fetches from API when token not in override chain market data', async () => {
      // Token exists on 0x5 but not on 0x89
      renderUseTokenExchangeRate(
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        undefined,
        '0x89',
      );

      // Should trigger API fetch since token not in 0x89 market data
      await waitFor(() => {
        expect(fetchTokenExchangeRates).toHaveBeenCalledWith(
          'POL',
          ['0xdAC17F958D2ee523a2206206994597C13D831ec7'],
          '0x89',
        );
      });
    });

    it('native: returns conversion rate for override chain', () => {
      // Current chain is 0x5 (ETH), but we request native rate for 0x89 (POL)
      const {
        result: { current: exchangeRate },
      } = renderUseTokenExchangeRate(undefined, undefined, '0x89');

      expect(String(exchangeRate?.value)).toEqual('0.25');
    });

    it('native: returns undefined when override chain has no conversion rate', () => {
      const {
        result: { current: exchangeRate },
      } = renderUseTokenExchangeRate(
        undefined,
        {
          assetsPrice: {
            'eip155:1/slip44:60': {
              assetPriceType: 'fungible',
              price: ETH_RATE,
              usdPrice: ETH_RATE,
              lastUpdated: LAST_UPDATED,
            },
            'eip155:5/slip44:60': {
              assetPriceType: 'fungible',
              price: ETH_RATE,
              usdPrice: ETH_RATE,
              lastUpdated: LAST_UPDATED,
            },
            // POL native rate omitted
          },
        },
        '0x89',
      );

      expect(exchangeRate?.value).toBe(undefined);
    });

    it('ERC-20: fetches from API with override chainId when not in state', async () => {
      (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
        Promise.resolve({
          '0x0000000000000000000000000000000000000002': 2.0,
        }),
      );

      renderUseTokenExchangeRate(
        '0x0000000000000000000000000000000000000002',
        undefined,
        '0x89',
      );

      await waitFor(() => {
        expect(fetchTokenExchangeRates).toHaveBeenCalledWith(
          'POL',
          ['0x0000000000000000000000000000000000000002'],
          '0x89',
        );
      });
    });

    it('ERC-20: caches rates per chain to prevent cross-chain contamination', async () => {
      const tokenAddress = '0x0000000000000000000000000000000000000003';
      (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
        Promise.resolve({ [tokenAddress]: 1.5 }),
      );

      // First render on chain 0x5
      renderUseTokenExchangeRate(tokenAddress, undefined, '0x5');

      await waitFor(() => {
        expect(fetchTokenExchangeRates).toHaveBeenCalledWith(
          'ETH',
          [tokenAddress],
          '0x5',
        );
      });

      // Second render on chain 0x89 - should trigger a new fetch, not use cached rate
      renderUseTokenExchangeRate(tokenAddress, undefined, '0x89');

      await waitFor(() => {
        expect(fetchTokenExchangeRates).toHaveBeenCalledWith(
          'POL',
          [tokenAddress],
          '0x89',
        );
      });

      expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(2);
    });

    it('ERC-20: shares an in-flight fetch for the same chain and token', async () => {
      const tokenAddress = '0x0000000000000000000000000000000000000004';
      const queryClient = createQueryClient();
      let resolveFetch: (value: Record<string, number>) => void = () =>
        undefined;
      (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      const firstRender = renderUseTokenExchangeRate(
        tokenAddress,
        undefined,
        '0x5',
        { queryClient },
      );
      const secondRender = renderUseTokenExchangeRate(
        tokenAddress,
        undefined,
        '0x5',
        { queryClient },
      );

      await waitFor(() => {
        expect(fetchTokenExchangeRates).toBeCalledTimes(1);
      });

      resolveFetch({ [tokenAddress]: 1.5 });

      await waitFor(() => {
        expect(String(firstRender.result.current?.value)).toEqual('16.65');
        expect(String(secondRender.result.current?.value)).toEqual('16.65');
      });
    });
  });
});
