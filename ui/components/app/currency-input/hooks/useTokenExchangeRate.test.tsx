import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import useTokenExchangeRate from './useTokenExchangeRate';

const renderUseTokenExchangeRate = (tokenAddress?: string) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currencyRates: {
        ETH: {
          conversionRate: 11.1,
        },
      },
      contractExchangeRates: {
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': 0.5,
        '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': 3.304588,
      },
      providerConfig: {
        ticker: 'ETH',
      },
    },
  };

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = ({ children }: any) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(() => useTokenExchangeRate(tokenAddress), { wrapper });
};

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

  it('ERC-20: price is unavailable', () => {
    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(
      '0x0000000000000000000000000000000000000001',
    );

    expect(exchangeRate?.value).toBe(undefined);
  });

  it('native: price is available', () => {
    const {
      result: { current: exchangeRate },
    } = renderUseTokenExchangeRate(undefined);

    expect(String(exchangeRate?.value)).toBe('11.1');
  });
});
