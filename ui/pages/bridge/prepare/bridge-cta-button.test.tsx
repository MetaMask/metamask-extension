import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { BridgeCTAButton } from './bridge-cta-button';

describe('BridgeCTAButton', () => {
  it("should render the component's initial state", () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
      },
      { fromTokenInputValue: 1 },
    );
    const { container, getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Select token')).toBeInTheDocument();
    expect(getByRole('button')).toBeDisabled();
  });

  it('should render the component when tx is submittable', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {},
    );
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Bridge')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });
});
