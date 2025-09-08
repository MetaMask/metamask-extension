import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import mockState from '../../../../test/data/mock-state.json';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { MultichainAddressRowsList } from './multichain-address-rows-list';

const mockStore = configureStore([]);

const accounts: Record<string, InternalAccount> = {
  ethereum: { ...MOCK_ACCOUNT_EOA, scopes: ['eip155:*'] },
  polygon: {
    ...MOCK_ACCOUNT_EOA,
    id: '2',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    scopes: ['eip155:137'],
  },
  solana: { ...MOCK_ACCOUNT_SOLANA_MAINNET, scopes: ['solana:*'] },
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
  bitcoin: { ...MOCK_ACCOUNT_BIP122_P2WPKH, scopes: ['bip122:*'] },
};

const createMockState = () => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      addSolanaAccount: true,
      addBitcoinAccount: true,
    },
    // Override the EVM network configurations to have proper names
    networkConfigurationsByChainId: {
      '0x1': {
        ...mockState.metamask.networkConfigurationsByChainId['0x1'],
        name: 'Ethereum',
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon',
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
        name: 'Arbitrum',
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
      ...Object.fromEntries(
        Object.entries(
          mockState.metamask.networkConfigurationsByChainId,
        ).filter(([chainId]) => !['0x1'].includes(chainId)),
      ),
    },
    multichainNetworkConfigurationsByChainId: {
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
    },
    internalAccounts: {
      selectedAccount: accounts.ethereum.id,
      accounts: Object.fromEntries(
        Object.values(accounts).map((acc) => [acc.id, acc]),
      ),
    },
  },
});

const meta: Meta<typeof MultichainAddressRowsList> = {
  title: 'Components/MultichainAccounts/MultichainAddressRowsList',
  component: MultichainAddressRowsList,
  decorators: [
    (Story) => (
      <Provider store={mockStore(createMockState())}>
        <div style={{ width: '400px', padding: '16px' }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MultichainAddressRowsList>;

export const MultipleDifferentAccounts: Story = {
  args: {
    accounts: [
      accounts.ethereum,
      accounts.solana,
      accounts.solanaTestnet,
      accounts.bitcoin,
    ],
  },
};

export const SingleEthereumAccount: Story = {
  args: { accounts: [accounts.ethereum] },
};

export const SpecificNetworkAccount: Story = {
  args: { accounts: [accounts.polygon] },
};

export const SolanaOnly: Story = {
  args: { accounts: [accounts.solana] },
};

export const EmptyState: Story = {
  args: { accounts: [] },
};
