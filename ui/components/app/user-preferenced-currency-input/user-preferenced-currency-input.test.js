import React from 'react';
import configureMockStore from 'redux-mock-store';

import UserPreferencedCurrencyInput from '.';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

describe('UserPreferencedCurrencyInput Component', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);
  describe('rendering', () => {
    it('should match snapshot', () => {
      const mockStore = configureMockStore()(mockState);

      const { container } = renderWithProvider(
        <UserPreferencedCurrencyInput />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
