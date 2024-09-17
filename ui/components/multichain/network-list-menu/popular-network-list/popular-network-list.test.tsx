import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useDispatch, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { getUnapprovedConfirmations } from '../../../../selectors';
import {
  CHAIN_IDS,
  RPCDefinition,
} from '../../../../../shared/constants/network';
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
          chainId: CHAIN_IDS.MAINNET,
          nickname: 'Network 1',
          rpcPrefs: {
            blockExplorerUrl: 'https://etherscan.com/',
            imageUrl: 'https://example.com/image1.png',
          },
          ticker: 'ETH',
          rpcUrl: 'https://exampleEth.org/',
        },
        {
          chainId: CHAIN_IDS.BSC_TESTNET,
          nickname: 'Network 2',
          rpcPrefs: {
            blockExplorerUrl: 'https://examplescan.com/',
            imageUrl: 'https://example.com/image2.png',
          },
          ticker: 'TST',
          rpcUrl: 'https://example.org/',
        },
      ] as RPCDefinition[],
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
          chainId: CHAIN_IDS.BSC_TESTNET,
          nickname: 'Network 2',
          rpcPrefs: {
            blockExplorerUrl: 'https://examplescan.com/',
            imageUrl: 'https://example.com/image2.png',
          },
          ticker: 'TST',
          rpcUrl: 'https://example.org/',
        },
      ] as RPCDefinition[],
    };

    render(<PopularNetworkList {...props} />);
    const addButton = screen.getByTestId('test-add-button');
    fireEvent.click(addButton);

    expect(useDispatchMock).toHaveBeenCalled();
  });
});
