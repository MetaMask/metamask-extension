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
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';

const mockStore = configureStore([]);

const accounts: Record<string, InternalAccount> = {
  ethereum: { ...MOCK_ACCOUNT_EOA, scopes: ['eip155:1'] },
  polygon: {
    ...MOCK_ACCOUNT_EOA,
    id: '2',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    scopes: ['eip155:137'],
  },
  solana: {
    ...MOCK_ACCOUNT_SOLANA_MAINNET,
    scopes: [MultichainNetworks.SOLANA],
    metadata: {
      ...MOCK_ACCOUNT_SOLANA_MAINNET.metadata,
      snap: {
        enabled: true,
        name: 'Solana Snap',
        id: 'npm:@consensys/solana-snap',
      },
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
      snap: {
        enabled: true,
        name: 'Solana Snap',
        id: 'npm:@consensys/solana-snap',
      },
    },
  },
  bitcoin: {
    ...MOCK_ACCOUNT_BIP122_P2WPKH,
    scopes: ['bip122:000000000019d6689c085ae165831e93'],
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
    // Override the EVM network configurations to have proper names
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
      ...Object.fromEntries(
        Object.entries(
          mockState.metamask.networkConfigurationsByChainId,
        ).filter(([chainId]) => !['0x1'].includes(chainId)),
      ),
    },
    multichainNetworkConfigurationsByChainId: {
      [MultichainNetworks.SOLANA]: {
        chainId: MultichainNetworks.SOLANA,
        name: 'Solana Mainnet',
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

const meta: Meta<typeof MultichainAggregatedAddressListRow> = {
  title: 'Components/MultichainAccounts/MultichainAggregatedAddressListRow',
  component: MultichainAggregatedAddressListRow,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays an aggregated list row with multiple network avatars, truncated address, and a copy action. The group name is automatically derived from the chain IDs - "Ethereum" for EVM chains or the network name for non-EVM chains.',
      },
    },
  },
  argTypes: {
    chainIds: {
      control: 'array',
      description: 'List of chain ids associated with an address',
    },
    address: {
      control: 'text',
      description: 'Address string to display (will be truncated)',
    },
    copyActionParams: {
      control: 'object',
      description:
        'Copy parameters for the address, including message and callback function',
    },
    className: {
      control: 'text',
      description: 'Optional className for additional styling',
    },
  },
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
type Story = StoryObj<typeof MultichainAggregatedAddressListRow>;

export const DefaultEthereum: Story = {
  args: {
    chainIds: ['0x1'],
    address: '0x1234567890abcdef1234567890abcdef12345678',
    copyActionParams: {
      message: 'Address copied!',
      callback: () => {
        navigator.clipboard.writeText(
          '0x1234567890abcdef1234567890abcdef12345678',
        );
        console.log('Address copied to clipboard');
      },
    },
  },
};

export const ManyNetworks: Story = {
  args: {
    chainIds: ['0x1', '0x89', '0xa4b1', '0xa', '0x2105', '0x8274f'],
    address: '0x1234567890abcdef1234567890abcdef12345678',
    copyActionParams: {
      message: 'Address copied!',
      callback: () => {
        navigator.clipboard.writeText(
          '0x1234567890abcdef1234567890abcdef12345678',
        );
        console.log('Address copied to clipboard');
      },
    },
  },
};

export const NonEvmNetwork: Story = {
  args: {
    chainIds: [MultichainNetworks.SOLANA],
    address: 'DfGj1XfVTbfM7VZvqLkVNvDhFb4Nt8xBpGpH5f2r3Dqq',
    copyActionParams: {
      message: 'Address copied!',
      callback: () => {
        navigator.clipboard.writeText(
          'DfGj1XfVTbfM7VZvqLkVNvDhFb4Nt8xBpGpH5f2r3Dqq',
        );
        console.log('Solana address copied to clipboard');
      },
    },
  },
};
