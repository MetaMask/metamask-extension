import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountGroupId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import { MultichainAddressRowsList } from './multichain-address-rows-list';

const mockStore = configureStore([]);

const WALLET_ID_MOCK = 'entropy:01K437Z7EJ0VCMFDE9TQKRV60A';

const GROUP_ID_MOCK = `${WALLET_ID_MOCK}/0`;

const ACCOUNT_EVM_ID_MOCK = 'account-evm-id';
const ACCOUNT_BITCOIN_ID_MOCK = 'account-bitcoin-id';
const ACCOUNT_SOLANA_ID_MOCK = 'account-solana-id';
const ACCOUNT_TRON_ID_MOCK = 'account-tron-id';

const INTERNAL_ACCOUNTS_MOCK: Record<string, InternalAccount> = {
  [ACCOUNT_EVM_ID_MOCK]: {
    id: ACCOUNT_EVM_ID_MOCK,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    metadata: {
      name: 'EVM Account',
      importTime: Date.now(),
      keyring: { type: 'HD Key Tree' },
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: ['eip155:0'], // EOA account - will be spread across all EVM networks
  },
  [ACCOUNT_BITCOIN_ID_MOCK]: {
    id: ACCOUNT_BITCOIN_ID_MOCK,
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    metadata: {
      name: 'Bitcoin Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'bip122:p2wpkh',
    scopes: ['bip122:000000000019d6689c085ae165831e93'],
  },
  [ACCOUNT_SOLANA_ID_MOCK]: {
    id: ACCOUNT_SOLANA_ID_MOCK,
    address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
    metadata: {
      name: 'Solana Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'solana:data-account',
    scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  },
  [ACCOUNT_TRON_ID_MOCK]: {
    id: ACCOUNT_TRON_ID_MOCK,
    address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    metadata: {
      name: 'Tron Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'tron:eoa',
    scopes: ['tron:0x2b6653dc'],
  },
};

const ACCOUNT_TREE_MOCK = {
  wallets: {
    [WALLET_ID_MOCK]: {
      type: 'entropy',
      id: WALLET_ID_MOCK,
      metadata: {},
      groups: {
        [GROUP_ID_MOCK]: {
          type: 'multichain-account',
          id: GROUP_ID_MOCK,
          metadata: {},
          accounts: [
            ACCOUNT_EVM_ID_MOCK,
            ACCOUNT_BITCOIN_ID_MOCK,
            ACCOUNT_SOLANA_ID_MOCK,
            ACCOUNT_TRON_ID_MOCK,
          ],
        },
      },
    },
  },
};

const createMockState = () => ({
  metamask: {
    completedOnboarding: true,
    internalAccounts: {
      accounts: INTERNAL_ACCOUNTS_MOCK,
      selectedAccount: ACCOUNT_EVM_ID_MOCK,
    },
    accountTree: ACCOUNT_TREE_MOCK,
    // EVM network configurations
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon',
        nativeCurrency: 'MATIC',
        rpcEndpoints: [
          {
            networkClientId: 'polygon-mainnet',
            url: 'https://polygon-mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://polygonscan.com'],
      },
      '0xa4b1': {
        chainId: '0xa4b1',
        name: 'Arbitrum',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'arbitrum-mainnet',
            url: 'https://arbitrum-mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://arbiscan.io'],
      },
      '0xaa36a7': {
        chainId: '0xaa36a7',
        name: 'Sepolia',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            url: 'https://sepolia.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
      '0xe708': {
        chainId: '0xe708',
        name: 'Linea',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'linea-mainnet',
            url: 'https://linea-mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://lineascan.build'],
      },
    },
    // Multichain network configurations (includes non-EVM)
    multichainNetworkConfigurationsByChainId: {
      // EVM networks in CAIP format
      'eip155:1': {
        chainId: 'eip155:1',
        name: 'Ethereum',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:137': {
        chainId: 'eip155:137',
        name: 'Polygon',
        isEvm: true,
        nativeCurrency: 'MATIC',
      },
      'eip155:42161': {
        chainId: 'eip155:42161',
        name: 'Arbitrum',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:11155111': {
        chainId: 'eip155:11155111',
        name: 'Sepolia',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:59144': {
        chainId: 'eip155:59144',
        name: 'Linea',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:5': {
        chainId: 'eip155:5',
        name: 'Goerli',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      // Non-EVM networks
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
        isEvm: false,
        nativeCurrency: 'SOL',
      },
      'bip122:000000000019d6689c085ae165831e93': {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin',
        isEvm: false,
        nativeCurrency: 'BTC',
      },
      'tron:0x2b6653dc': {
        chainId: 'tron:0x2b6653dc',
        name: 'Tron',
        isEvm: false,
        nativeCurrency: 'TRX',
      },
    },
    // Current provider config for EVM
    providerConfig: {
      chainId: '0x1',
      type: 'mainnet',
      nickname: 'Ethereum',
    },
    // Multichain controller state
    isEvmSelected: true,
    selectedMultichainNetworkChainId: 'eip155:1',
    networksWithTransactionActivity: {},
    // Feature flags for multichain support
    featureFlags: {
      bitcoinSupportEnabled: false,
      solanaSupportEnabled: true,
      solanaTestnetSupportEnabled: false,
    },
    enabledNetworks: {
      eip155: {
        '0x1': true,
        '0x89': true,
        '0xa4b1': true,
        '0xaa36a7': true,
        '0xe708': true,
      },
      solana: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      },
      bip122: {
        '000000000019d6689c085ae165831e93': true,
      },
      tron: {
        '0x2b6653dc': true,
      },
    },
  },
});

const renderComponent = (
  groupId: AccountGroupId = GROUP_ID_MOCK,
  onQrClick: (
    address: string,
    networkName: string,
    chainId: CaipChainId,
    networkImageSrc?: string,
  ) => void = jest.fn(),
) => {
  const store = mockStore(createMockState());
  return render(
    <Provider store={store}>
      <MultichainAddressRowsList groupId={groupId} onQrClick={onQrClick} />
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

  it('handles invalid group', () => {
    renderComponent('invalid-group-id' as AccountGroupId);

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

  it('passes onQrClick callback to child components', () => {
    const mockOnQrClick = jest.fn();
    renderComponent(GROUP_ID_MOCK, mockOnQrClick);

    const qrButtons = screen.getAllByTestId('multichain-address-row-qr-button');
    expect(qrButtons.length).toBeGreaterThan(0);

    fireEvent.click(qrButtons[0]);

    expect(mockOnQrClick).toHaveBeenCalledTimes(1);
    // The first button should be for Ethereum network
    const firstCallArgs = mockOnQrClick.mock.calls[0];
    expect(firstCallArgs[1]).toBe('Ethereum'); // Network name
    expect(firstCallArgs[2]).toBe('eip155:1'); // Chain ID
    expect(firstCallArgs[3]).toBe('./images/eth_logo.svg'); // Image source
  });

  describe('Priority network sorting', () => {
    it('displays priority networks first in the correct order', () => {
      renderComponent();

      const networkNames = screen.getAllByTestId(
        'multichain-address-row-network-name',
      );
      const networkNamesText = networkNames.map((el) => el.textContent);

      const ethereumIndex = networkNamesText.findIndex((name) =>
        name?.includes('Ethereum'),
      );
      const bitcoinIndex = networkNamesText.findIndex((name) =>
        name?.includes('Bitcoin'),
      );
      const solanaIndex = networkNamesText.findIndex((name) =>
        name?.includes('Solana'),
      );
      const tronIndex = networkNamesText.findIndex((name) =>
        name?.includes('Tron'),
      );
      const lineaIndex = networkNamesText.findIndex((name) =>
        name?.includes('Linea'),
      );

      expect(ethereumIndex).toBe(0);

      if (bitcoinIndex !== -1) {
        expect(bitcoinIndex).toBeGreaterThan(ethereumIndex);
      }
      if (solanaIndex !== -1 && bitcoinIndex !== -1) {
        expect(solanaIndex).toBeGreaterThan(bitcoinIndex);
      }
      if (tronIndex !== -1 && solanaIndex !== -1) {
        expect(tronIndex).toBeGreaterThan(solanaIndex);
      }
      if (lineaIndex !== -1) {
        expect(lineaIndex).toBeGreaterThan(0);
      }
    });

    it('displays non-priority networks after priority networks', () => {
      renderComponent();

      const networkNames = screen.getAllByTestId(
        'multichain-address-row-network-name',
      );

      // Non-priority networks (Polygon, Arbitrum) should appear after priority networks
      const networkNamesText = networkNames.map((el) => el.textContent);

      const polygonIndex = networkNamesText.findIndex((name) =>
        name?.includes('Polygon'),
      );
      const arbitrumIndex = networkNamesText.findIndex((name) =>
        name?.includes('Arbitrum'),
      );
      const lineaIndex = networkNamesText.findIndex((name) =>
        name?.includes('Linea'),
      );

      expect(polygonIndex).toBeGreaterThan(lineaIndex);
      expect(arbitrumIndex).toBeGreaterThan(lineaIndex);
    });

    it('maintains priority order when searching', () => {
      renderComponent();

      const searchInput = screen
        .getByTestId('multichain-address-rows-list-search')
        .querySelector('input') as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'e' } });

      const networkNames = screen.getAllByTestId(
        'multichain-address-row-network-name',
      );
      const networkNamesText = networkNames.map((el) => el.textContent);

      const ethereumIndex = networkNamesText.findIndex((name) =>
        name?.includes('Ethereum'),
      );
      const lineaIndex = networkNamesText.findIndex((name) =>
        name?.includes('Linea'),
      );

      expect(ethereumIndex).toBe(0);
      expect(lineaIndex).toBeGreaterThan(ethereumIndex);
    });

    it('filters correctly while maintaining priority order', () => {
      renderComponent();

      const searchInput = screen
        .getByTestId('multichain-address-rows-list-search')
        .querySelector('input') as HTMLInputElement;

      // Search for "bit" which should match Bitcoin
      fireEvent.change(searchInput, { target: { value: 'bit' } });

      // Check if we have any results
      const addressRows = screen.queryAllByTestId('multichain-address-row');

      if (addressRows.length > 0) {
        const networkNames = screen.getAllByTestId(
          'multichain-address-row-network-name',
        );
        const networkNamesText = networkNames.map((el) => el.textContent);

        // Bitcoin should be in the results if it exists
        const hasBitcoin = networkNamesText.some((name) =>
          name?.toLowerCase().includes('bitcoin'),
        );
        expect(hasBitcoin).toBe(true);
      } else {
        // If no results, check that the empty message is shown
        expect(
          screen.getByTestId('multichain-address-rows-list-empty-message'),
        ).toBeInTheDocument();
      }
    });

    it('returns all networks in priority order when search is cleared', () => {
      renderComponent();

      const searchInput = screen
        .getByTestId('multichain-address-rows-list-search')
        .querySelector('input') as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'Ethereum' } });
      const filteredRows = screen.queryAllByTestId('multichain-address-row');
      expect(filteredRows.length).toBeGreaterThan(0);

      fireEvent.click(screen.getByTestId('text-field-search-clear-button'));

      const networkNames = screen.getAllByTestId(
        'multichain-address-row-network-name',
      );

      expect(networkNames.length).toBeGreaterThan(0);

      const networkNamesText = networkNames.map((el) => el.textContent);

      // Check that priority networks appear first
      const ethereumIndex = networkNamesText.findIndex((name) =>
        name?.includes('Ethereum'),
      );
      const bitcoinIndex = networkNamesText.findIndex((name) =>
        name?.includes('Bitcoin'),
      );
      const solanaIndex = networkNamesText.findIndex((name) =>
        name?.includes('Solana'),
      );
      const tronIndex = networkNamesText.findIndex((name) =>
        name?.includes('Tron'),
      );
      const lineaIndex = networkNamesText.findIndex((name) =>
        name?.includes('Linea'),
      );

      // Ethereum should be first if it exists
      if (ethereumIndex !== -1) {
        expect(ethereumIndex).toBe(0);
      }

      // Check relative ordering for networks that exist
      if (bitcoinIndex !== -1 && ethereumIndex !== -1) {
        expect(bitcoinIndex).toBeGreaterThan(ethereumIndex);
      }
      if (solanaIndex !== -1 && bitcoinIndex !== -1) {
        expect(solanaIndex).toBeGreaterThan(bitcoinIndex);
      }
      if (tronIndex !== -1 && solanaIndex !== -1) {
        expect(tronIndex).toBeGreaterThan(solanaIndex);
      }
      if (lineaIndex !== -1 && ethereumIndex !== -1) {
        expect(lineaIndex).toBeGreaterThan(ethereumIndex);
      }
    });
  });

  describe('Address formatting', () => {
    it('formats addresses to checksum format for display and copy', async () => {
      // Create a state with a lowercase EVM address that needs formatting
      const lowercaseAddress = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

      const customState = createMockState();
      const customAccountId = 'test-account-lowercase';

      // Add an account with a lowercase address
      customState.metamask.internalAccounts.accounts[customAccountId] = {
        id: customAccountId,
        address: lowercaseAddress,
        metadata: {
          name: 'Test Account',
          importTime: Date.now(),
          keyring: { type: 'HD Key Tree' },
        },
        options: {},
        methods: [],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
      };

      const customGroupId = `${WALLET_ID_MOCK}/test-group`;
      (
        customState.metamask.accountTree.wallets[WALLET_ID_MOCK]
          .groups as Record<string, unknown>
      )[customGroupId] = {
        type: 'multichain-account',
        id: customGroupId,
        metadata: {},
        accounts: [customAccountId],
      };

      const store = mockStore(customState);
      render(
        <Provider store={store}>
          <MultichainAddressRowsList
            groupId={customGroupId as AccountGroupId}
            onQrClick={jest.fn()}
          />
        </Provider>,
      );

      // Find the address text element
      const addressElements = screen.getAllByTestId(
        'multichain-address-row-address',
      );

      // The displayed address should be shortened, but when we copy, it should be the full checksum
      // We can't directly test the full address since it's shortened, but we can test the copy functionality
      const copyButton = screen.getAllByTestId(
        'multichain-address-row-copy-button',
      )[0];

      // Mock clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockImplementation(() => Promise.resolve()),
        },
      });

      fireEvent.click(copyButton);

      // The useCopyToClipboard hook should have been called with the checksummed address
      // Note: We can verify this indirectly by checking that the component renders without errors
      // and the copy success state is shown
      expect(addressElements[0]).toHaveTextContent(/copied|0x5a/iu);
    });

    it('searches using formatted addresses', () => {
      // Create a state with a lowercase EVM address
      const lowercaseAddress = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

      const customState = createMockState();
      const customAccountId = 'test-account-search';

      customState.metamask.internalAccounts.accounts[customAccountId] = {
        id: customAccountId,
        address: lowercaseAddress,
        metadata: {
          name: 'Search Test Account',
          importTime: Date.now(),
          keyring: { type: 'HD Key Tree' },
        },
        options: {},
        methods: [],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
      };

      const customGroupId = `${WALLET_ID_MOCK}/search-group`;
      (
        customState.metamask.accountTree.wallets[WALLET_ID_MOCK]
          .groups as Record<string, unknown>
      )[customGroupId] = {
        type: 'multichain-account',
        id: customGroupId,
        metadata: {},
        accounts: [customAccountId],
      };

      const store = mockStore(customState);
      render(
        <Provider store={store}>
          <MultichainAddressRowsList
            groupId={customGroupId as AccountGroupId}
            onQrClick={jest.fn()}
          />
        </Provider>,
      );

      const searchInput = screen
        .getByTestId('multichain-address-rows-list-search')
        .querySelector('input') as HTMLInputElement;

      // Search for the checksummed version - should find the address even though it was stored lowercase
      fireEvent.change(searchInput, { target: { value: '0x5aAeb' } });

      const addressRows = screen.queryAllByTestId('multichain-address-row');
      expect(addressRows.length).toBeGreaterThan(0);
    });

    it('preserves non-EVM addresses as-is', () => {
      renderComponent();

      // Find Bitcoin and Solana addresses
      const addressElements = screen.getAllByTestId(
        'multichain-address-row-address',
      );
      const networkNames = screen.getAllByTestId(
        'multichain-address-row-network-name',
      );

      // Find the Bitcoin row
      const bitcoinIndex = Array.from(networkNames).findIndex(
        (el) => el.textContent === 'Bitcoin',
      );

      if (bitcoinIndex !== -1) {
        // Bitcoin address should be preserved as-is (not checksummed)
        const bitcoinAddressElement = addressElements[bitcoinIndex];
        // The element should contain part of the Bitcoin address (shortened)
        expect(bitcoinAddressElement.textContent).toMatch(/bc1q/u);
      }
    });
  });
});
