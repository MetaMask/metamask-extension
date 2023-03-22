import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import AddNetwork from './add-network';

jest.mock('../../../selectors', () => ({
  getNetworkConfigurations: () => ({
    networkConfigurationId: {
      chainId: '0x539',
      nickname: 'Localhost 8545',
      rpcPrefs: {},
      rpcUrl: 'http://localhost:8545',
      ticker: 'ETH',
    },
    networkConfigurationId2: {
      chainId: '0xA4B1',
      nickname: 'Arbitrum One',
      rpcPrefs: { blockExplorerUrl: 'https://explorer.arbitrum.io' },
      rpcUrl:
        'https://arbitrum-mainnet.infura.io/v3/7e127583378c4732a858df2550aff333',
      ticker: 'AETH',
    },
  }),
  getUnapprovedConfirmations: jest.fn(),
  getTheme: () => 'light',
}));

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<AddNetwork />, store);
};

describe('AddNetwork', () => {
  it('should show Add from a list.. text', () => {
    render();
    expect(
      screen.getByText(
        'Add from a list of popular networks or add a network manually. Only interact with the entities you trust.',
      ),
    ).toBeInTheDocument();
  });

  it('should show Popular custom networks text', () => {
    render();
    expect(screen.getByText('Popular custom networks')).toBeInTheDocument();
  });

  it('should show Arbitrum One network nickname', () => {
    render();
    expect(screen.getByText('Arbitrum One')).toBeInTheDocument();
  });
});
