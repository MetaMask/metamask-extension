import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { SmartContractAccountToggle } from './smart-contract-account-toggle';
import { SmartContractAccountToggleStory } from './smart-contract-account-toggle-story';
import { EIP7702NetworkConfiguration } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { Hex } from '@metamask/utils';
import configureStore from '../../../store/store';
import { Box } from '../../component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';

const mockAddress: Hex = '0x742d35Cc6634C0532925a3b8D4E8f3c9B26e6e6e';

// Create a mock store with the necessary state for the hooks
const mockStore = configureStore({
  metamask: {
    // Mock state for useEIP7702Account hook
    selectedNetworkClientId: 'mainnet',
    networksMetadata: {
      mainnet: {
        EIPS: { 1559: true },
        status: 'available',
      },
    },
    // Mock state for useBatchAuthorizationRequests hook
    transactions: [],
    // Other required state
    internalAccounts: {
      selectedAccount: 'account-1',
      accounts: {
        'account-1': {
          id: 'account-1',
          address: mockAddress,
          type: 'eip155:eoa',
          options: {},
          methods: [],
          scopes: [],
          metadata: {
            name: 'Account 1',
            importTime: Date.now(),
            keyring: { type: 'HD Key Tree' },
          },
        },
      },
    },
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            type: 'infura',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
    },
  },
});

const mockNetworkConfig: EIP7702NetworkConfiguration = {
  chainId: 'eip155:1' as const,
  chainIdHex: '0x1' as Hex,
  name: 'Ethereum Mainnet',
  isSupported: false,
  upgradeContractAddress: '0x1234567890123456789012345678901234567890' as Hex,
  isEvm: true,
  nativeCurrency: 'ETH',
  blockExplorerUrls: ['https://etherscan.io'],
  defaultBlockExplorerUrlIndex: 0,
};

const meta: Meta<typeof SmartContractAccountToggle> = {
  title: 'Components/MultichainAccounts/SmartContractAccountToggle',
  component: SmartContractAccountToggle,
  parameters: {
    docs: {
      description: {
        component:
          'A toggle switch component for enabling/disabling smart contract account functionality on EIP-7702 compatible networks.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <Box
          style={{ width: '368px' }}
          backgroundColor={BackgroundColor.backgroundAlternative}
          padding={4}
        >
          <Story />
        </Box>
      </Provider>
    ),
  ],
  argTypes: {
    networkConfig: {
      description: 'EIP-7702 network configuration object',
      control: { type: 'object' },
    },
    address: {
      description: 'Hexadecimal address of the account',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SmartContractAccountToggle>;

export const Default: Story = {
  render: (args) => (
    <SmartContractAccountToggleStory
      networkConfig={args.networkConfig}
      address={args.address}
    />
  ),
  args: {
    networkConfig: mockNetworkConfig,
    address: mockAddress,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive version with working toggle functionality. Check the console for toggle actions.',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <SmartContractAccountToggleStory
      networkConfig={args.networkConfig}
      address={args.address}
      disabled={true}
    />
  ),
  args: {
    networkConfig: mockNetworkConfig,
    address: mockAddress,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state - toggle cannot be interacted with.',
      },
    },
  },
};
