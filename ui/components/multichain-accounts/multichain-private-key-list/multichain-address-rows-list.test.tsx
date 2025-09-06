import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountGroupId } from '@metamask/account-api';
import { MultichainPrivateKeyList } from './multichain-private-key-list';

const mockStore = configureStore([]);

const WALLET_ID_MOCK = 'entropy:01K437Z7EJ0VCMFDE9TQKRV60A';

const GROUP_ID_MOCK = `${WALLET_ID_MOCK}/0`;

const ACCOUNT_ONE_ID_MOCK = 'account-one-id';
const ACCOUNT_TWO_ID_MOCK = 'account-two-id';

const INTERNAL_ACCOUNTS_MOCK: Record<string, InternalAccount> = {
  [ACCOUNT_ONE_ID_MOCK]: {
    id: ACCOUNT_ONE_ID_MOCK,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    metadata: {
      name: 'Ethereum Account',
      importTime: Date.now(),
      keyring: { type: 'HD Key Tree' },
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: ['eip155:0'],
  },
  [ACCOUNT_TWO_ID_MOCK]: {
    id: ACCOUNT_TWO_ID_MOCK,
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
          accounts: [ACCOUNT_ONE_ID_MOCK, ACCOUNT_TWO_ID_MOCK],
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
      selectedAccount: ACCOUNT_ONE_ID_MOCK,
    },
    accountTree: ACCOUNT_TREE_MOCK,
    // EVM network configurations
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
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
        name: 'Polygon Mainnet',
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
        name: 'Arbitrum One',
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
    },
    // Multichain network configurations (includes non-EVM)
    multichainNetworkConfigurationsByChainId: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
        isEvm: false,
        nativeCurrency: 'SOL',
      },
    },
    // Current provider config for EVM
    providerConfig: {
      chainId: '0x1',
      type: 'mainnet',
      nickname: 'Ethereum Mainnet',
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
      },
      solana: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      },
    },
  },
});

const renderComponent = (
  groupId: AccountGroupId = GROUP_ID_MOCK,
  onQrClick: (
    address: string,
    networkName: string,
    networkImageSrc?: string,
  ) => void = jest.fn(),
) => {
  const store = mockStore(createMockState());
  return render(
    <Provider store={store}>
      <MultichainPrivateKeyList groupId={groupId} />
    </Provider>,
  );
};

describe('MultichainPrivateKeyList', () => {
  it('renders with addresses', () => {
    renderComponent();

    expect(
      screen.getByTestId('multichain-private-key-list'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('multichain-address-row').length,
    ).toBeGreaterThan(0);
  });

  it('handles invalid group', () => {
    renderComponent('invalid-group-id' as AccountGroupId);

    expect(
      screen.getByTestId('multichain-private-key-list'),
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId('multichain-address-row').length).toBe(0);
  });
});
