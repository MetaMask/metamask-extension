import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';
import useTokenExchangeRate from './useTokenExchangeRate';

const renderUseTokenExchangeRate = (
  tokenAddress?: string,
  metaMaskState?: Record<string, unknown>,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currencyRates: {
        ETH: {
          conversionRate: 11.1,
        },
      },
      marketData: {
        '0x5': {
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': { price: 0.5 },
          '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': { price: 3.304588 },
        },
      },
      ...metaMaskState,
    },
  };

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = ({ children }: any) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(() => useTokenExchangeRate(tokenAddress), { wrapper });
};

jest.mock('../../../../helpers/utils/util', () => ({
  fetchTokenExchangeRates: jest.fn(),
}));

describe('useProcessNewDecimalValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('eRC-20: price is available', () => {
    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    );

    expect(String(exchangeRate?.value)).toEqual('5.55');
  });

  it('eRC-20: price is unavailable through state but available through API', async () => {
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
    expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(1);
  });

  it('eRC-20: price is unavailable through state and through API', async () => {
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
    expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(1);
  });

  it('eRC-20: price is unavailable through state but API call fails', async () => {
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
    expect(fetchTokenExchangeRates).toHaveBeenCalledTimes(1);
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
});
