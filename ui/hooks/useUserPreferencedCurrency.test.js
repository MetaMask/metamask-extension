import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';

import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { mockNetworkState } from '../../test/stub/networks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { useUserPreferencedCurrency } from './useUserPreferencedCurrency';

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
        showFiatInTestnets: state.showFiat,
        showNativeTokenAsMainBalance: state.showNativeTokenAsMainBalance,
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
const tests = [
  {
    state: {
      showNativeTokenAsMainBalance: true,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      showNativeOverride: true,
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 8,
    },
  },
  {
    state: {
      showNativeTokenAsMainBalance: true,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      showFiatOverride: true,
    },
    result: {
      currency: 'usd',
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      showNativeTokenAsMainBalance: true,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      type: 'PRIMARY',
      shouldCheckShowNativeToken: true,
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 8,
    },
  },
  {
    state: {
      showNativeTokenAsMainBalance: false,
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
      showNativeTokenAsMainBalance: false,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      type: 'SECONDARY',
    },
    result: {
      currency: 'usd',
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      showNativeTokenAsMainBalance: false,
      nativeCurrency: 'ETH',
      showFiat: false,
      currentCurrency: 'usd',
    },
    params: {
      type: 'SECONDARY',
    },
    result: {
      currency: 'ETH',
      numberOfDecimals: 8,
    },
  },
  {
    state: {
      showNativeTokenAsMainBalance: true,
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
      showNativeTokenAsMainBalance: true,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      type: 'SECONDARY',
    },
    result: {
      currency: 'usd',
      numberOfDecimals: 2,
    },
  },
  {
    state: {
      showNativeTokenAsMainBalance: true,
      nativeCurrency: 'ETH',
      showFiat: true,
      currentCurrency: 'usd',
    },
    params: {
      type: 'SECONDARY',
      shouldCheckShowNativeToken: true,
    },
    result: {
      currency: 'usd',
      numberOfDecimals: 2,
    },
  },
];
describe('useUserPreferencedCurrency', () => {
  tests.forEach(({ params: { type, ...otherParams }, state, result }) => {
    describe(`when showFiat is ${state.showFiat}, shouldCheckShowNativeToken is ${otherParams.shouldCheckShowNativeToken}, showNativeTokenAsMainBalance is ${state.showNativeTokenAsMainBalance} and type is ${type}`, () => {
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
