import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainAddressRowsList } from './multichain-address-rows-list';

const mockStore = configureStore([]);

jest.mock('../../../selectors', () => ({
  getMetaMaskAccounts: () => ({}),
  getSelectedAccount: () => ({}),
  getMultichainIsEvm: () => true,
  getNetworkConfigurationsByChainId: () => ({}),
  getCurrentChainId: () => '0x1',
}));

jest.mock('../../../selectors/multichain', () => ({
  getImageForChainId: () => './images/eth_logo.svg',
}));

jest.mock('../../../selectors/multichain/networks', () => ({
  getMultichainNetworkConfigurationsByChainId: () => [
    {
      'eip155:1': {
        chainId: 'eip155:1',
        name: 'Ethereum Mainnet',
        isEvm: true,
      },
      'eip155:137': {
        chainId: 'eip155:137',
        name: 'Polygon Mainnet',
        isEvm: true,
      },
      'eip155:42161': {
        chainId: 'eip155:42161',
        name: 'Arbitrum One',
        isEvm: true,
      },
      'eip155:11155111': {
        chainId: 'eip155:11155111',
        name: 'Sepolia',
        isEvm: true,
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
        isEvm: false,
      },
    },
    {},
  ],
  getSelectedMultichainNetworkChainId: () => 'eip155:1',
  getMultichainIsEvm: () => true,
}));

const accounts: InternalAccount[] = [
  {
    id: '1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    metadata: {
      name: 'Ethereum Account',
      importTime: Date.now(),
      keyring: { type: 'HD Key Tree' },
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: ['eip155:*'],
  },
  {
    id: '2',
    address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
    metadata: {
      name: 'Solana Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'solana:data-account',
    scopes: ['solana:*'],
  },
];

const renderComponent = (accountsList = accounts) => {
  const store = mockStore({ metamask: { completedOnboarding: true } });
  return render(
    <Provider store={store}>
      <MultichainAddressRowsList accounts={accountsList} />
    </Provider>,
  );
};

describe('MultichainAddressRowsList', () => {
  it('renders with accounts and search functionality', () => {
    renderComponent();

    expect(
      screen.getByTestId('multichain-address-rows-list'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('multichain-address-rows-list-search'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('multichain-address-row').length,
    ).toBeGreaterThan(0);
  });

  it('filters results when searching', () => {
    renderComponent();

    const searchInput = screen
      .getByTestId('multichain-address-rows-list-search')
      .querySelector('input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Ethereum' } });

    expect(
      screen.getAllByTestId('multichain-address-row').length,
    ).toBeGreaterThan(0);
  });

  it('shows no results for invalid search', () => {
    renderComponent();

    const searchInput = screen
      .getByTestId('multichain-address-rows-list-search')
      .querySelector('input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'NonExistentNetwork' } });

    expect(screen.queryAllByTestId('multichain-address-row').length).toBe(0);
    expect(
      screen.getByTestId('multichain-address-rows-list-empty-message'),
    ).toHaveTextContent('noNetworksFound');
  });

  it('clears search when clear button is clicked', () => {
    renderComponent();

    const searchInput = screen
      .getByTestId('multichain-address-rows-list-search')
      .querySelector('input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Ethereum' } });
    expect(searchInput).toHaveValue('Ethereum');

    fireEvent.click(screen.getByTestId('text-field-search-clear-button'));
    expect(searchInput).toHaveValue('');
  });

  it('handles empty accounts list', () => {
    renderComponent([]);

    expect(
      screen.getByTestId('multichain-address-rows-list'),
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId('multichain-address-row').length).toBe(0);
    expect(
      screen.getByTestId('multichain-address-rows-list-empty-message'),
    ).toHaveTextContent('noNetworksAvailable');
  });

  it('shows empty message when search returns no results', () => {
    renderComponent();

    const searchInput = screen
      .getByTestId('multichain-address-rows-list-search')
      .querySelector('input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'NonExistentNetwork' } });

    expect(screen.queryAllByTestId('multichain-address-row').length).toBe(0);
    expect(
      screen.getByTestId('multichain-address-rows-list-empty-message'),
    ).toHaveTextContent('noNetworksFound');
  });
});
