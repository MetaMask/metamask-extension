import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import NetworkListItem from './network-list-item'; // Adjust the path as needed
import '@testing-library/jest-dom/extend-expect';
import { setEditedNetwork, toggleNetworkMenu } from '../../../../store/actions';

const mockStore = configureMockStore([thunk]);

const setup = (props) => {
  const store = mockStore({});
  return render(
    <Provider store={store}>
      <NetworkListItem {...props} />
    </Provider>,
  );
};

describe('NetworkListItem', () => {
  it('renders correctly with required props', () => {
    const { container } = setup({
      item: {
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        nickname: 'Ethereum Mainnet',
        rpcPrefs: { imageUrl: '/images/mainnet.png' },
      },
      index: 0,
      rpcName: 'Infura Mainnet',
      setSelectedNetwork: jest.fn(),
      setActionMode: jest.fn(),
    });
    expect(container).toMatchSnapshot();
  });
  it('renders the network list item with correct data', () => {
    setup({
      item: {
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        nickname: 'Ethereum Mainnet',
        rpcPrefs: { imageUrl: '/images/mainnet.png' },
      },
      index: 0,
      rpcName: 'Infura Mainnet',
      setSelectedNetwork: jest.fn(),
      setActionMode: jest.fn(),
    });

    expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
    expect(screen.getByText('Infura Mainnet')).toBeInTheDocument();
  });

  it('shows tooltip with rpcUrl on hover', () => {
    setup({
      item: {
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        nickname: 'Ethereum Mainnet',
        rpcPrefs: { imageUrl: '/images/mainnet.png' },
      },
      index: 0,
      rpcName: 'Infura Mainnet',
      setSelectedNetwork: jest.fn(),
      setActionMode: jest.fn(),
    });

    fireEvent.mouseOver(screen.getByText('Infura Mainnet'));
    expect(
      screen.getByText('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
    ).toBeInTheDocument();
  });
});
