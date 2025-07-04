import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { NetworkManager } from './network-manager';

// Mock the store actions
jest.mock('../../../store/actions', () => ({
  hideModal: jest.fn(),
}));

// Mock useDispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockNetworkConfigurations = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    rpcEndpoints: [
      {
        url: 'https://mainnet.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
  '0xa': {
    chainId: '0xa',
    name: 'Optimism',
    rpcEndpoints: [
      {
        url: 'https://optimism-mainnet.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'optimism-mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
  '0xa4b1': {
    chainId: '0xa4b1',
    name: 'Arbitrum One',
    rpcEndpoints: [
      {
        url: 'https://arbitrum-mainnet.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'arbitrum-mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://arbiscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
  '0xa86a': {
    chainId: '0xa86a',
    name: 'Avalanche',
    rpcEndpoints: [
      {
        url: 'https://avalanche-mainnet.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'avalanche-mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://snowtrace.io'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'AVAX',
  },
  '0x2105': {
    chainId: '0x2105',
    name: 'Base',
    rpcEndpoints: [
      {
        url: 'https://base-mainnet.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'base-mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://basescan.org'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
};

describe('NetworkManager Component', () => {
  const renderNetworkManager = () => {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        networkConfigurationsByChainId: mockNetworkConfigurations,
        selectedNetworkClientId: 'mainnet',
        providerConfig: {
          chainId: '0x1',
          rpcUrl: 'https://mainnet.infura.io/v3/123',
          type: 'rpc',
          ticker: 'ETH',
        },
      },
    });
    return renderWithProvider(<NetworkManager />, store);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    renderNetworkManager();

    // Verify tabs are rendered
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();

    // Verify default tab content is rendered
    expect(screen.getByText('Select all')).toBeInTheDocument();
    expect(screen.getByText('Arbitrum One')).toBeInTheDocument();
    expect(screen.getByText('Optimism')).toBeInTheDocument();
    expect(screen.getByText('Avalanche')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
  });

  it('switches tab when tab is clicked', () => {
    renderNetworkManager();

    // Verify that Default tab is active by default
    expect(screen.getByText('Select all')).toBeInTheDocument();

    // Click on Custom tab
    fireEvent.click(screen.getByText('Custom'));

    // Verify Custom tab content is rendered
    expect(screen.getByText('Add custom network')).toBeInTheDocument();
  });
});
