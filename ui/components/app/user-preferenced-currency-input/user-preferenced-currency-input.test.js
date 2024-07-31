import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import UserPreferencedCurrencyInput from '.';

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

describe('UserPreferencedCurrencyInput Component', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);
  describe('rendering', () => {
    it('should match snapshot', () => {
      const mockStore = configureMockStore()({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            // This is now enabled by default in `mock-state.json`, so disable it to match
            // the original behavior
            showFiatInTestnets: false,
          },
        },
      });

      const { container } = renderWithProvider(
        <UserPreferencedCurrencyInput />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
