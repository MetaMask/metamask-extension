import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
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
    const { container } = renderWithProvider(
      <PopularNetworkList {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('displays the network list when networks are provided', () => {
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

    render(<PopularNetworkList {...props} />);
    expect(screen.getByText('Network 1')).toBeInTheDocument();
    expect(screen.getByText('Network 2')).toBeInTheDocument();
  });
  it('calls the dispatch function when the add button is clicked', async () => {
    const props = {
      ...defaultProps,
      searchAddNetworkResults: [
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

    render(<PopularNetworkList {...props} />);
    const addButton = screen.getByTestId('test-add-button');
    fireEvent.click(addButton);

    expect(useDispatchMock).toHaveBeenCalled();
  });
});
