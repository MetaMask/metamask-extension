import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider, useDispatch } from 'react-redux';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { NetworkItems } from './NetworkItems';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

// Mock out the utility modules that NetworkItems uses.
jest.mock('../../../../../shared/modules/network.utils', () => ({
  getNetworkIcon: jest.fn().mockReturnValue('test-icon-src'),
  // For testing, we can pretend the default RPC endpoint is 'https://test-rpc'
  // and there's only 1 endpoint, unless overridden in a specific test.
  getRpcDataByChainId: jest.fn().mockReturnValue({
    rpcEndpoints: [
      {
        url: 'https://test-rpc',
        name: 'test',
        networkClientId: 'test',
      },
    ],
    defaultRpcEndpoint: 'https://test-rpc',
  }),
  convertCaipToHexChainId: jest.fn().mockReturnValue('0x99'),
}));

// Mock the hook that checks if the user has any accounts in the given network.
jest.mock(
  '../../../../hooks/accounts/useAccountCreationOnNetworkChange',
  () => ({
    useAccountCreationOnNetworkChange: () => ({
      hasAnyAccountsInNetwork: jest.fn().mockReturnValue(false),
    }),
  }),
);

describe('NetworkItems', () => {
  const mockStore = configureStore([]);
  const dispatchMock = jest.fn();

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
    dispatchMock.mockClear();
  });

  // Example EVM networks map that gets passed in as `evmNetworks`
  // The key must match the shape Record<`0x${string}`, NetworkConfiguration>
  // (i.e., '0x99', '0x1', etc.)
  const mockEvmNetworks: Record<`0x${string}`, NetworkConfiguration> = {
    '0x99': {
      chainId: '0x99',
      name: 'Test Network',
      nativeCurrency: 'TEST',
      rpcEndpoints: [
        {
          url: 'https://test-rpc',
          name: 'test',
          networkClientId: 'test',
          type: RpcEndpointType.Custom,
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://test-explorer'],
      defaultBlockExplorerUrlIndex: 0,
    },
  };

  // Mock network as a MultichainNetworkConfiguration
  const mockMultichainNetwork: MultichainNetworkConfiguration = {
    chainId: 'eip155:0x99', // matches the "0x99" key in mockEvmNetworks
    name: 'Test Network',
    isEvm: true,
    nativeCurrency: 'TEST',
    blockExplorerUrls: ['https://test-explorer'],
    defaultBlockExplorerUrlIndex: 0,
  };

  // Base props for rendering the NetworkItems component
  const baseProps = {
    network: mockMultichainNetwork,
    isUnlocked: true,
    currentChainId: '0x99', // same as network.chainId => isCurrentNetwork = true
    handleNetworkChange: jest.fn(),
    toggleNetworkMenu: jest.fn(),
    setActionMode: jest.fn(),
    focusSearch: false,
    evmNetworks: mockEvmNetworks,
  };

  const renderComponent = (overrideProps = {}) => {
    const store = mockStore({});
    return render(
      <Provider store={store}>
        <NetworkItems {...baseProps} {...overrideProps} />
      </Provider>,
    );
  };

  it('renders correctly and matches snapshot', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

  it('renders NetworkListItem with correct name and default props', () => {
    renderComponent();

    expect(screen.getByText('Test Network')).toBeInTheDocument();
  });

  it('calls handleNetworkChange when the NetworkListItem is clicked', () => {
    renderComponent();
    const networkItem = screen.getByText('Test Network');

    fireEvent.click(networkItem);

    expect(baseProps.handleNetworkChange).toHaveBeenCalledWith(
      mockMultichainNetwork.chainId,
    );
  });

  it('does NOT render Delete button if the network is MAINNET, or user is locked, or it is current network', () => {
    renderComponent();

    const deleteButton = screen.queryByLabelText('delete');
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('does not render the RPC endpoint button if showMultiRpcSelectors is false', () => {
    renderComponent();

    const rpcButton = screen.queryByLabelText('select rpc');
    expect(rpcButton).not.toBeInTheDocument();
  });
});
