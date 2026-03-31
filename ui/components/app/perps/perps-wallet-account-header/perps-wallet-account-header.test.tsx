import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { PerpsWalletAccountHeader } from './perps-wallet-account-header';

describe('PerpsWalletAccountHeader', () => {
  it('renders account header when a selected account exists', () => {
    const store = configureStore({ metamask: mockState.metamask });

    renderWithProvider(<PerpsWalletAccountHeader />, store);

    expect(
      screen.getByTestId('perps-wallet-account-header'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-wallet-account-header-name'),
    ).toBeInTheDocument();
  });
});
