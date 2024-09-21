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
      const mockStore = configureMockStore()(mockState);

      const { container } = renderWithProvider(
        <UserPreferencedCurrencyInput />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
