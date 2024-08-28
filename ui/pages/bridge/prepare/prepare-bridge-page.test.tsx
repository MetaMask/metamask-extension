import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import PrepareBridgePage from './prepare-bridge-page';

describe('PrepareBridgePage', () => {
  it('should render the component', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
      },
      {},
      { fromTokenInputValue: 1 },
    );
    const { container, getByRole } = renderWithProvider(
      <PrepareBridgePage />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByRole('button', { name: /ETH/u })).toBeInTheDocument();
    expect(getByRole('button', { name: /Select token/u })).toBeInTheDocument();
  });
});
