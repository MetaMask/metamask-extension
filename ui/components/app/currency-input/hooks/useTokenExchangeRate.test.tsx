import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import useTokenExchangeRate from './useTokenExchangeRate';

const renderUseTokenExchangeRate = (
  tokenAddress?: string,
  metaMaskState?: Record<string, unknown>,
  overrideChainId?: Hex,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currencyRates: {
        ETH: {
          conversionRate: 11.1,
        },
        POL: {
          conversionRate: 0.25,
        },
      },
      marketData: {
        '0x5': {
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': { price: 0.5 },
          '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': { price: 3.304588 },
        },
        '0x89': {
          '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { price: 1.0 },
        },
      },
      ...metaMaskState,
    },
  };

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = ({ children }: any) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(() => useTokenExchangeRate(tokenAddress, overrideChainId), {
    wrapper,
  });
};

jest.mock('../../../../helpers/utils/util', () => ({
  fetchTokenExchangeRates: jest.fn(),
}));

describe('useProcessNewDecimalValue', () => {
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

    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    waitFor(() => {
      expect(exchangeRate?.value).toBe('2.34');
    });
    expect(fetchTokenExchangeRates).toBeCalledTimes(1);
  });

  it('ERC-20: price is unavailable through state and through API', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
      Promise.resolve({
        'Not token': '2.34',
      }),
    );

    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    waitFor(() => {
      expect(exchangeRate?.value).toBe(undefined);
    });
    expect(fetchTokenExchangeRates).toBeCalledTimes(1);
  });

  it('ERC-20: price is unavailable through state but API call fails', async () => {
    (fetchTokenExchangeRates as jest.Mock).mockReturnValue(
      Promise.reject(new Error('error')),
    );

    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    waitFor(() => {
      expect(exchangeRate?.value).toBe(undefined);
    });
    expect(fetchTokenExchangeRates).toBeCalledTimes(1);
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
    } = renderUseTokenExchangeRate(undefined, { currencyRates: {} });

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

    it('ERC-20: fetches from API when token not in override chain market data', () => {
      // Token exists on 0x5 but not on 0x89
      renderUseTokenExchangeRate(
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        undefined,
        '0x89',
      );

      // Should trigger API fetch since token not in 0x89 market data
      expect(fetchTokenExchangeRates).toHaveBeenCalledWith(
        'POL',
        ['0xdAC17F958D2ee523a2206206994597C13D831ec7'],
        '0x89',
      );
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
          currencyRates: {
            ETH: { conversionRate: 11.1 },
            // POL not included
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

      expect(fetchTokenExchangeRates).toHaveBeenCalledWith(
        'POL',
        ['0x0000000000000000000000000000000000000002'],
        '0x89',
      );
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
  });
});
