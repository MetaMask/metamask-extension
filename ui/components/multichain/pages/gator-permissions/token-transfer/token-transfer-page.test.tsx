import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { TokenTransferPage } from './token-transfer-page';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
});

describe('Token Transfer Page', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = renderWithProvider(
        <TokenTransferPage />,
        store,
      );
      expect(container).toMatchSnapshot();

      expect(getByTestId('token-transfer-page')).toBeInTheDocument();
    });

    it('renders Token Transfer page title', () => {
      const { getByTestId } = renderWithProvider(<TokenTransferPage />, store);
      expect(getByTestId('token-transfer-page-title')).toBeInTheDocument();
    });
  });
});
