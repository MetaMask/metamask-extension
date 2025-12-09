import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';

import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';

import { useEthFiatAmount } from './useEthFiatAmount';

const renderUseEthFiatAmount = (ethAmount, overrides, state) => {
  const wrapper = ({ children }) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(() => useEthFiatAmount(ethAmount, overrides), { wrapper });
};

describe('useEthFiatAmount', () => {
  const baseState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      currentCurrency: 'usd',
      preferences: {
        ...mockState.metamask.preferences,
        showFiatInTestnets: true,
      },
    },
  };

  describe('basic functionality', () => {
    it('should return formatted fiat amount', () => {
      const state = {
        ...baseState,
        metamask: {
          ...baseState.metamask,
          currencyRates: { ETH: { conversionRate: 2000 } },
        },
      };

      const { result } = renderUseEthFiatAmount('1', { showFiat: true }, state);
      expect(result.current).toBe('$2,000.00 USD');
    });

    it('should return undefined when ethAmount is undefined', () => {
      const state = {
        ...baseState,
        metamask: {
          ...baseState.metamask,
          currencyRates: { ETH: { conversionRate: 2000 } },
        },
      };

      const { result } = renderUseEthFiatAmount(
        undefined,
        { showFiat: true },
        state,
      );
      expect(result.current).toBeUndefined();
    });

    it('should return undefined when conversionRate is 0', () => {
      const state = {
        ...baseState,
        metamask: {
          ...baseState.metamask,
          currencyRates: { ETH: { conversionRate: 0 } },
        },
      };

      const { result } = renderUseEthFiatAmount('1', { showFiat: true }, state);
      expect(result.current).toBeUndefined();
    });
  });

  describe('BigNumber precision handling', () => {
    // This test documents a bug where conversionRate with >15 significant digits
    // causes BigNumber to throw: "times() number type has more than 15 significant digits"
    // See: https://github.com/MikeMcl/bignumber.js/issues/11
    //
    // The fix is to convert conversionRate to string before passing to .times():
    //   new BigNumber(ethAmount.toString()).times(conversionRate.toString())
    //
    // This test should PASS once the fix is applied.
    it('should handle conversionRate with more than 15 significant digits', () => {
      // 3106.9104158770647 has 17 significant digits
      // This is a realistic ETH/USD rate that can occur
      const highPrecisionRate = 3106.9104158770647;

      const state = {
        ...baseState,
        metamask: {
          ...baseState.metamask,
          currencyRates: { ETH: { conversionRate: highPrecisionRate } },
        },
      };

      const { result } = renderUseEthFiatAmount('1', { showFiat: true }, state);

      // The hook should return a valid fiat string, not throw or return undefined
      // If BigNumber throws, result.error will be set
      expect(result.error).toBeUndefined();
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('string');
      expect(result.current).toContain('$');
    });

    it('should handle various high-precision conversionRates without errors', () => {
      // Various rates that could have >15 significant digits in their
      // floating-point representation
      const highPrecisionRates = [
        3106.9104158770647, // 17 significant digits - actual rate from bug report
        1234.5678901234567, // 17 significant digits
        2999.9999999999995, // edge case near round number
      ];

      highPrecisionRates.forEach((rate) => {
        const state = {
          ...baseState,
          metamask: {
            ...baseState.metamask,
            currencyRates: { ETH: { conversionRate: rate } },
          },
        };

        const { result } = renderUseEthFiatAmount(
          '0.5',
          { showFiat: true },
          state,
        );

        // Should not have thrown an error
        expect(result.error).toBeUndefined();
        // Should return a valid formatted string
        expect(result.current).toBeDefined();
        expect(typeof result.current).toBe('string');
      });
    });
  });
});
