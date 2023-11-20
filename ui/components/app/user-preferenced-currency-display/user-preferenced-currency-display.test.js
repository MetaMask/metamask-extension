import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  MAINNET_DISPLAY_NAME,
  NETWORK_TYPES,
  CHAIN_IDS,
} from '../../../../shared/constants/network';
import UserPreferencedCurrencyDisplay from '.';

describe('UserPreferencedCurrencyDisplay Component', () => {
  describe('rendering', () => {
    const mockState = {
      metamask: {
        providerConfig: {
          chainId: CHAIN_IDS.MAINNET,
          nickname: MAINNET_DISPLAY_NAME,
          type: NETWORK_TYPES.MAINNET,
        },
        currencyRates: {},
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: true,
        },
      },
    };
    const mockStore = configureMockStore()(mockState);
    it('should match snapshot', () => {
      const { container } = renderWithProvider(
        <UserPreferencedCurrencyDisplay />,
        mockStore,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
