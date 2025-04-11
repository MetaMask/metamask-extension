import React from 'react';
import configureMockStore from 'redux-mock-store';

import UserPreferencedTokenInput from '.';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

describe('UserPreferencedCurrencyInput Component', () => {
  describe('rendering', () => {
    const mockStore = configureMockStore()(mockState);

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
