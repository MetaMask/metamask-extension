import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';

import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';

const tests = [
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: true,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 8,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: 'usd',
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: true,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'SECONDARY',
      fiatNumberOfDecimals: 4,
      fiatPrefix: '-',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 4,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'SECONDARY',
      fiatNumberOfDecimals: 4,
      numberOfDecimals: 3,
      fiatPrefix: 'a',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 3,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: false,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 8,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      useNativeCurrencyAsPrimaryCurrency: false,
      nativeCurrency: 'ETH',
      showFiat: true,
    },
    params: {
      type: 'PRIMARY',
    },
    result: {
      currency: undefined,
      numberOfDecimals: 2,
    },
  },
];

const renderUseUserPreferencedCurrency = (state, value, restProps) => {
  const defaultState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      ...mockNetworkState({
        chainId: state.showFiat ? CHAIN_IDS.MAINNET : CHAIN_IDS.LOCALHOST,
        ticker: state?.nativeCurrency,
      }),
      currentCurrency: state.currentCurrency,
      currencyRates: { ETH: { conversionRate: 280.45 } },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency:
          state.useNativeCurrencyAsPrimaryCurrency,
        showFiatInTestnets: state.showFiat,
      },
    },
  };

  const wrapper = ({ children }) => (
    <Provider store={configureStore(defaultState)}>{children}</Provider>
  );

  return renderHook(() => useUserPreferencedCurrency(value, restProps), {
    wrapper,
  });
};

describe('useUserPreferencedCurrency', () => {
  tests.forEach(({ params: { type, ...otherParams }, state, result }) => {
    describe(`when showFiat is ${state.showFiat}, useNativeCurrencyAsPrimary is ${state.useNativeCurrencyAsPrimaryCurrency} and type is ${type}`, () => {
      const { result: hookResult } = renderUseUserPreferencedCurrency(
        state,
        type,
        otherParams,
      );
      it(`should return currency as ${
        result.currency || 'not modified by user preferences'
      }`, () => {
        expect(hookResult.current.currency).toStrictEqual(result.currency);
      });
      it(`should return decimals as ${
        result.numberOfDecimals || 'not modified by user preferences'
      }`, () => {
        expect(hookResult.current.numberOfDecimals).toStrictEqual(
          result.numberOfDecimals,
        );
      });
    });
  });
});
