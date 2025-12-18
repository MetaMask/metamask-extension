import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import {
  AccountGroupId,
  AccountWalletType,
  toAccountWalletId,
} from '@metamask/account-api';
import mockState from '../../../../test/data/mock-state.json';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { MultichainHoveredAddressRowsList } from './multichain-hovered-address-rows-hovered-list';

const mockStore = configureStore([]);

const mockWalletEntropySource = '01234567890ABCDEFGHIJKLMNOP';
const WALLET_ID = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletEntropySource,
);
const GROUP_ID = `${WALLET_ID}/0` as AccountGroupId;

const accounts: Record<string, InternalAccount> = {
  ethereum: {
    ...MOCK_ACCOUNT_EOA,
    id: 'ethereum-account',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'eip155:eoa',
    scopes: ['eip155:*'],
    metadata: {
      ...MOCK_ACCOUNT_EOA.metadata,
      name: 'Ethereum Account',
    },
  },
  polygon: {
    ...MOCK_ACCOUNT_EOA,
    id: 'polygon-account',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    type: 'eip155:eoa',
    scopes: ['eip155:137'],
    metadata: {
      ...MOCK_ACCOUNT_EOA.metadata,
      name: 'Polygon Account',
    },
  },
  solana: {
    ...MOCK_ACCOUNT_SOLANA_MAINNET,
    id: 'solana-account',
    address: '9A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGD',
    scopes: ['solana:*'],
    metadata: {
      ...MOCK_ACCOUNT_SOLANA_MAINNET.metadata,
      name: 'Solana Account',
    },
  },
  solanaTestnet: {
    ...MOCK_ACCOUNT_SOLANA_MAINNET,
    id: 'solana-testnet-account',
    address: '9A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGD',
    scopes: [MultichainNetworks.SOLANA_TESTNET],
    metadata: {
      ...MOCK_ACCOUNT_SOLANA_MAINNET.metadata,
      name: 'Solana Testnet Account',
    },
  },
  bitcoin: {
    ...MOCK_ACCOUNT_BIP122_P2WPKH,
    id: 'bitcoin-account',
    address: 'bc1q4v2dstzcpvkhz29l75kz5gxspvpxgxkdmhjaq8',
    scopes: ['bip122:*'],
    metadata: {
      ...MOCK_ACCOUNT_BIP122_P2WPKH.metadata,
      name: 'Bitcoin Account',
    },
  },
  multiChainAccount: {
    ...MOCK_ACCOUNT_EOA,
    id: 'multi-chain-account',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    type: 'eip155:eoa',
    scopes: ['eip155:*'],
    metadata: {
      ...MOCK_ACCOUNT_EOA.metadata,
      name: 'Multi-Chain Account',
    },
  },
};

const createMockState = () => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      solanaAccounts: { enabled: true, minimumVersion: '13.6.0' },
      bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
    },
    accountTree: {
      wallets: {
        [WALLET_ID]: {
          type: 'entropy',
          id: WALLET_ID,
          metadata: {},
          groups: {
            [GROUP_ID]: {
              type: 'multichain-account',
              id: GROUP_ID,
              metadata: {
                name: 'Storybook Account Group',
                entropy: {
                  groupIndex: 0,
                },
                pinned: false,
                hidden: false,
              },
              accounts: Object.keys(accounts).map(
                (key) => accounts[key as keyof typeof accounts].id,
              ),
            },
          },
        },
      },
    },
    networkConfigurationsByChainId: {
      '0x1': {
        ...mockState.metamask.networkConfigurationsByChainId['0x1'],
        name: 'Ethereum Mainnet',
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon Mainnet',
        nativeCurrency: 'MATIC',
        rpcEndpoints: [
          {
            networkClientId: 'polygon',
            type: 'custom',
            url: 'https://polygon-rpc.com',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://polygonscan.com'],
        defaultBlockExplorerUrlIndex: 0,
      },
      '0xa4b1': {
        chainId: '0xa4b1',
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'arbitrum',
            type: 'custom',
            url: 'https://arb1.arbitrum.io/rpc',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://arbiscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
      '0xa': {
        chainId: '0xa',
        name: 'Optimism',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'optimism',
            type: 'custom',
            url: 'https://mainnet.optimism.io',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://optimistic.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
      '0xe708': {
        chainId: '0xe708',
        name: 'Linea',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'linea',
            type: 'custom',
            url: 'https://rpc.linea.build',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://lineascan.build'],
        defaultBlockExplorerUrlIndex: 0,
      },
      ...Object.fromEntries(
        Object.entries(
          mockState.metamask.networkConfigurationsByChainId,
        ).filter(
          ([chainId]) =>
            !['0x1', '0x89', '0xa4b1', '0xa', '0xe708'].includes(chainId),
        ),
      ),
    },
    multichainNetworkConfigurationsByChainId: {
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
      'eip155:10': {
        chainId: 'eip155:10',
        name: 'Optimism',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      'eip155:59144': {
        chainId: 'eip155:59144',
        name: 'Linea',
        isEvm: true,
        nativeCurrency: 'ETH',
      },
      [MultichainNetworks.SOLANA]: {
        chainId: MultichainNetworks.SOLANA,
        name: 'Solana with a really long name',
        nativeCurrency: 'SOL',
        isEvm: false,
      },
      [MultichainNetworks.SOLANA_TESTNET]: {
        chainId: MultichainNetworks.SOLANA_TESTNET,
        name: 'Solana Testnet',
        nativeCurrency: 'SOL',
        isEvm: false,
      },
      'bip122:000000000019d6689c085ae165831e93': {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin Mainnet',
        nativeCurrency: 'BTC',
        isEvm: false,
      },
      'tron:0x2b6653dc': {
        chainId: 'tron:0x2b6653dc',
        name: 'Tron Mainnet',
        nativeCurrency: 'TRX',
        isEvm: false,
      },
    },
    internalAccounts: {
      selectedAccount: accounts.ethereum.id,
      accounts: Object.fromEntries(
        Object.values(accounts).map((acc) => [acc.id, acc]),
      ),
    },
    balances: {
      totalBalanceInUserCurrency: 1234.56,
      userCurrency: 'USD',
      wallets: {
        [WALLET_ID]: {
          walletId: WALLET_ID,
          totalBalanceInUserCurrency: 1234.56,
          userCurrency: 'USD',
          groups: {
            [GROUP_ID]: {
              totalBalanceInUserCurrency: 1234.56,
              userCurrency: 'USD',
              walletId: WALLET_ID,
              groupId: GROUP_ID,
            },
          },
        },
      },
    },
  },
});

const meta: Meta<typeof MultichainHoveredAddressRowsList> = {
  title: 'Components/MultichainAccounts/MultichainHoveredAddressRowsList',
  component: MultichainHoveredAddressRowsList,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a list of multichain addresses grouped by account and sorted by priority networks. It renders MultichainAggregatedAddressListRow components for each network group.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultichainHoveredAddressRowsList>;

export const MultipleDifferentAccounts: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see multiple accounts</button>,
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [
          accounts.ethereum.id,
          accounts.polygon.id,
          accounts.solana.id,
          accounts.bitcoin.id,
        ];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const SingleEthereumAccount: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see Ethereum account</button>,
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [accounts.ethereum.id];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const SpecificNetworkAccount: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see specific network</button>,
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [accounts.polygon.id];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const SolanaOnly: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see Solana account</button>,
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [accounts.solana.id, accounts.solanaTestnet.id];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const MultiChainSingleAccount: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see multi-chain account</button>,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows a single account that has multiple EVM chains aggregated into one row',
      },
    },
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [accounts.multiChainAccount.id];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const NonEvmOnly: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see non-EVM networks</button>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows only non-EVM networks (Bitcoin and Solana)',
      },
    },
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [accounts.bitcoin.id, accounts.solana.id];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const EmptyState: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see empty state</button>,
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        [];
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};

export const AllAccounts: Story = {
  args: {
    groupId: GROUP_ID,
    children: <button>Hover to see all accounts</button>,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows all available accounts with various network configurations',
      },
    },
  },
  decorators: [
    (Story) => {
      const state = createMockState();
      state.metamask.accountTree.wallets[WALLET_ID].groups[GROUP_ID].accounts =
        Object.values(accounts).map((acc) => acc.id);
      return (
        <Provider store={mockStore(state)}>
          <div style={{ width: '400px', padding: '16px' }}>
            <Story />
          </div>
        </Provider>
      );
    },
  ],
};
