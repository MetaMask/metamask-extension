import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import UserPreferencedCurrencyDisplay from '.';

describe('UserPreferencedCurrencyDisplay Component', () => {
  describe('rendering', () => {
    const mockState = {
      metamask: {
        provider: {
          chainId: '0x99',
        },
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
