import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useDispatch, useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { getUnapprovedConfirmations } from '../../../../selectors';
import PopularNetworkList from './popular-network-list';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const STATE_MOCK = {
  metamask: {
    providerConfig: {
      chainId: '0x1',
    },
  },
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

  it('displays the edge case message when there are no networks', () => {
    render(<PopularNetworkList {...defaultProps} />);
    expect(screen.getByTestId('all-networks-added')).toBeInTheDocument();
  });

  it('displays the network list when networks are provided', () => {
    const props = {
      ...defaultProps,
      searchAddNetworkResults: [
        {
          chainId: '1',
          nickname: 'Network 1',
          rpcPrefs: { imageUrl: 'https://example.com/image1.png' },
        },
        {
          chainId: '2',
          nickname: 'Network 2',
          rpcPrefs: { imageUrl: 'https://example.com/image2.png' },
        },
      ],
    };

    render(<PopularNetworkList {...props} />);
    expect(screen.getByText('Network 1')).toBeInTheDocument();
    expect(screen.getByText('Network 2')).toBeInTheDocument();
  });
});
