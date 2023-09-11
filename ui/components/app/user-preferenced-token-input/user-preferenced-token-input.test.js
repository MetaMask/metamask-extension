import React from 'react';
import configureMockStore from 'redux-mock-store';
import { screen } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import TokenInput from '../../ui/token-input/token-input.component';
import UserPreferencedTokenInput from '.';

jest.mock('../../ui/token-input/token-input.component', () =>
  jest.fn(() => {
    return <div> test </div>;
  }),
);

describe('UserPreferencedCurrencyInput Component', () => {
  describe('rendering', () => {
    const mockStore = configureMockStore()(mockState);

    const props = {
      token: {
        address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
      },
    };

    it('should match snapshot', () => {
      renderWithProvider(<UserPreferencedTokenInput {...props} />, mockStore);

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(TokenInput.mock.calls[0][0].showFiat).toBe(true);
    });
  });
});
