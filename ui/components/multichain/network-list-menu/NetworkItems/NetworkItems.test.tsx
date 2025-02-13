import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { NetworkItems } from './NetworkItems';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

describe('NetworkItems', () => {
  const mockStore = configureStore([]);
  const dispatchMock = jest.fn();

  // Mock sample data
  const mockNetwork: NetworkConfiguration = {
    chainId: '0x99',
    nativeCurrency: 'TEST',
    name: 'Test Network',
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
  };

  const baseProps = {
    network: mockNetwork,
    isUnlocked: true,
    currentChainId: '0x99', // same as mockNetwork, so isCurrentNetwork will be true
    handleNetworkChange: jest.fn(),
    toggleNetworkMenu: jest.fn(),
    setActionMode: jest.fn(),
    focusSearch: false,
    showMultiRpcSelectors: false,
  };

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
    dispatchMock.mockClear();
    baseProps.handleNetworkChange.mockClear();
    baseProps.toggleNetworkMenu.mockClear();
    baseProps.setActionMode.mockClear();
  });

  const renderComponent = (props = {}) => {
    const store = mockStore({});
    return render(
      <Provider store={store}>
        <NetworkItems {...baseProps} {...props} />
      </Provider>,
    );
  };

  it('renders correctly and matches snapshot', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

  it('renders NetworkListItem with correct name and default props', () => {
    renderComponent();

    expect(screen.getByText(/Test Network/i)).toBeInTheDocument();
  });

  it('calls handleNetworkChange when the NetworkListItem is clicked', () => {
    renderComponent();
    const networkItem = screen.getByText('Test Network');

    fireEvent.click(networkItem);

    expect(baseProps.handleNetworkChange).toHaveBeenCalledWith(mockNetwork);
  });

  it('does NOT render Delete button if the network is MAINNET, or user is locked, or it is current network', () => {
    renderComponent();

    const deleteButton = screen.queryByLabelText(/delete/i);
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('does not render the RPC endpoint button if showMultiRpcSelectors is false', () => {
    renderComponent();

    const rpcButton = screen.queryByLabelText(/select rpc/i);
    expect(rpcButton).not.toBeInTheDocument();
  });
});
