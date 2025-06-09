import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { SmartContractAccountToggleSection } from './smart-contract-account-toggle-section';
import { Hex } from '@metamask/utils';
import configureStore from '../../../store/store';
import { Box } from '../../component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';

const mockAddress: Hex = '0x742d35Cc6634C0532925a3b8D4E8f3c9B26e6e6e';

// Create a comprehensive mock store with EIP-7702 network support
const mockStore = configureStore({
  metamask: {
    // Required for useEIP7702Networks
    multichainNetworkConfigurationsByChainId: {
      'eip155:1': {
        chainId: 'eip155:1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        isEvm: true,
      },
      'eip155:11155111': {
        chainId: 'eip155:11155111',
        name: 'Sepolia',
        nativeCurrency: 'SepoliaETH',
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        isEvm: true,
      },
    },
    // Network configurations for conversion utilities
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
      '0xaa36a7': {
        chainId: '0xaa36a7',
        name: 'Sepolia',
        nativeCurrency: 'SepoliaETH',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            type: 'infura',
            url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
      },
    },
    // Required for useEIP7702Account hook
    selectedNetworkClientId: 'mainnet',
    networksMetadata: {
      mainnet: {
        EIPS: { 1559: true },
        status: 'available',
      },
      sepolia: {
        EIPS: { 1559: true },
        status: 'available',
      },
    },
    // Required for useBatchAuthorizationRequests hook
    transactions: [],
    // Required for account information
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
    // Required for remote feature flags that might be used
    remoteFeatureFlags: {},
  },
  // Required for useSelector to get accountDetailsAddress
  appState: {
    accountDetailsAddress: mockAddress,
  },
  // Required for translations
  localeMessages: {
    current: {
      enableSmartContractAccount: 'Enable Smart Contract Account',
      enableSmartContractAccountDescription: 'Transform your account into a smart contract account to unlock advanced features like account recovery, spending limits, and more.',
      learnMoreUpperCase: 'LEARN MORE',
    },
  },
});

const meta: Meta<typeof SmartContractAccountToggleSection> = {
  title: 'Components/MultichainAccounts/SmartContractAccountToggleSection',
  component: SmartContractAccountToggleSection,
  parameters: {
    docs: {
      description: {
        component: 'A section component that displays smart contract account toggle controls for all EIP-7702 compatible networks.',
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
};

export default meta;
type Story = StoryObj<typeof SmartContractAccountToggleSection>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default state showing the smart contract account toggle section with available EIP-7702 networks.',
      },
    },
  },
};

