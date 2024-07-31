import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import UserPreferencedTokenInput from '.';

describe('UserPreferencedCurrencyInput Component', () => {
  describe('rendering', () => {
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

    const props = {
      token: {
        address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
      },
    };

    it('should match snapshot', () => {
      const { container } = renderWithProvider(
        <UserPreferencedTokenInput {...props} />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
