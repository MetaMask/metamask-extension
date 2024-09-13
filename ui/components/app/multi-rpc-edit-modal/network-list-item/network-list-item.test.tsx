import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import NetworkListItem from './network-list-item';
import '@testing-library/jest-dom/extend-expect';

const mockStore = configureMockStore([thunk]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setup = (props: any) => {
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
      networkConfiguration: {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            name: 'Infura Mainnet',
            url: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
          },
        ],
      },
    });
    expect(container).toMatchSnapshot();
  });
  it('renders the network list item with correct data', () => {
    setup({
      networkConfiguration: {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            name: 'Infura Mainnet',
            url: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
          },
        ],
      },
    });

    expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
    expect(screen.getByText('Infura Mainnet')).toBeInTheDocument();
  });

  it('shows tooltip with rpcUrl on hover', () => {
    setup({
      networkConfiguration: {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [
          {
            name: 'Infura Mainnet',
            url: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
          },
        ],
      },
    });

    fireEvent.mouseOver(screen.getByText('Infura Mainnet'));
    expect(
      screen.getByText('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
    ).toBeInTheDocument();
  });
});
