//========
// Changes to this file demonstrate how the use of `useMessenger` in a component
// can be tested. (See the implementation file for the component for how
// `useMessenger` actually gets used.)
//========

import assert from 'assert';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { createMockMessenger } from '../../../../../test/lib/mock-messenger';
import { getUnapprovedConfirmations } from '../../../../selectors';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import PopularNetworkList from './popular-network-list';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const STATE_MOCK = {
  metamask: {},
};

describe('PopularNetworkList', () => {
  const store = configureStore()(STATE_MOCK);
  const useDispatchMock = useDispatch as jest.Mock;
  const useSelectorMock = useSelector as jest.Mock;
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    useDispatchMock.mockReturnValue(mockDispatch);

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getUnapprovedConfirmations) {
        return [];
      }
      return undefined;
    });
  });

  const defaultProps = {
    searchAddNetworkResults: [],
  };

  it('renders popular list component', () => {
    const messenger = createMockMessenger({
      'NetworkController:addNetwork': jest.fn(),
    });

    const { container } = renderWithProvider(
      <PopularNetworkList {...defaultProps} />,
      { store, messenger },
    );

    expect(container).toMatchSnapshot();
  });

  it('displays the network list when networks are provided', () => {
    const messenger = createMockMessenger({
      'NetworkController:addNetwork': jest.fn(),
    });

    const props = {
      ...defaultProps,
      searchAddNetworkResults: [
        {
          blockExplorerUrls: [],
          chainId: CHAIN_IDS.MAINNET,
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          name: 'Network 1',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              url: 'https://exampleEth.org/',
              type: RpcEndpointType.Custom as const,
              networkClientId: 'network1',
            },
          ],
        },
        {
          blockExplorerUrls: [],
          chainId: CHAIN_IDS.BSC_TESTNET,
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          name: 'Network 2',
          nativeCurrency: 'TST',
          rpcEndpoints: [
            {
              url: 'https://example.org/',
              type: RpcEndpointType.Custom as const,
              networkClientId: 'network2',
            },
          ],
        },
      ],
    };

    renderWithProvider(<PopularNetworkList {...props} />, { store, messenger });
    expect(screen.getByText('Network 1')).toBeInTheDocument();
    expect(screen.getByText('Network 2')).toBeInTheDocument();
  });

  it('calls NetworkController:addNetwork via messenger when the add button is clicked', async () => {
    const addNetwork = jest.fn().mockResolvedValue({ chainId: '0x61' });
    const messenger = createMockMessenger({
      'NetworkController:addNetwork': addNetwork,
    });

    const network = {
      blockExplorerUrls: [],
      chainId: CHAIN_IDS.BSC_TESTNET,
      defaultBlockExplorerUrlIndex: 0,
      defaultRpcEndpointIndex: 0,
      name: 'Network 2',
      nativeCurrency: 'TST',
      rpcEndpoints: [
        {
          url: 'https://example.org/',
          type: RpcEndpointType.Custom as const,
          networkClientId: 'network2',
        },
      ],
    };

    const props = {
      ...defaultProps,
      searchAddNetworkResults: [network],
    };

    renderWithProvider(<PopularNetworkList {...props} />, { store, messenger });

    // The data-testid is on a wrapper Box, but the onClick is on the button inside
    const addButtonContainer = screen.getByTestId('test-add-button');
    const addButton = addButtonContainer.querySelector('button');
    assert(addButton);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(addNetwork).toHaveBeenCalledWith(network);
    });
  });
});
