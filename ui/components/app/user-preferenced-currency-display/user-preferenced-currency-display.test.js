import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import UserPreferencedCurrencyDisplay from '.';

describe('UserPreferencedCurrencyDisplay Component', () => {
  describe('rendering', () => {
    const defaultState = {
      metamask: {
        ...mockState.metamask,
        selectedNetworkClientId: 'mainnet',
        currencyRates: {},
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: true,
        },
      },
    };
    const mockStore = configureMockStore()(defaultState);
    it('should match snapshot', () => {
      const { container } = renderWithProvider(
        <UserPreferencedCurrencyDisplay />,
        mockStore,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
