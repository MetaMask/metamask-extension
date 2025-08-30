import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AddressQRCodeModal } from './address-qr-code-modal';
import type { AddressQRCodeModalProps } from './address-qr-code-modal';
import { Button } from '@metamask/design-system-react';
import mockState from '../../../../test/data/mock-state.json';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';

const mockStore = configureStore([]);

// Use proper multichain mock accounts with correct scopes
const accounts = {
  ethereum: { ...MOCK_ACCOUNT_EOA, scopes: ['eip155:*'] },
  polygon: {
    ...MOCK_ACCOUNT_EOA,
    id: '2',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    scopes: ['eip155:137'],
    metadata: { ...MOCK_ACCOUNT_EOA.metadata, name: 'Polygon Account' },
  },
  arbitrum: {
    ...MOCK_ACCOUNT_EOA,
    id: '3', 
    address: '0x2468135790abcdef1234567890abcdef12345678',
    scopes: ['eip155:42161'],
    metadata: { ...MOCK_ACCOUNT_EOA.metadata, name: 'Arbitrum Account' },
  },
  solana: { ...MOCK_ACCOUNT_SOLANA_MAINNET, scopes: ['solana:*'] },
  bitcoin: { ...MOCK_ACCOUNT_BIP122_P2WPKH, scopes: ['bip122:*'] },
};

// Create enhanced mock state with proper multichain network configurations
const createMockState = () => ({
  ...mockState,
  localeMessages: {
    ...mockState.localeMessages,
    current: {
      ...mockState.localeMessages.current,
      addressQrCodeModalTitle: { message: '$1 / $2' },
      addressQrCodeModalHeading: { message: '$1 Address' },
      addressQrCodeModalDescription: {
        message: 'Use this address to receive tokens and collectibles on $1',
      },
      viewOnExplorer: { message: 'View on Explorer' },
      viewAddressOnExplorer: { message: 'View address on $1' },
    },
  },
  metamask: {
    ...mockState.metamask,
    // Add our multichain accounts to the internal accounts
    internalAccounts: {
      selectedAccount: accounts.ethereum.id,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        [accounts.ethereum.id]: accounts.ethereum,
        [accounts.polygon.id]: accounts.polygon,
        [accounts.arbitrum.id]: accounts.arbitrum,
        [accounts.solana.id]: accounts.solana,
        [accounts.bitcoin.id]: accounts.bitcoin,
      },
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
    // Add multichain network configurations for non-EVM chains
    multichainNetworkConfigurationsByChainId: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana Mainnet',
        nativeCurrency: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        isEvm: false,
      },
      'bip122:000000000019d6689c085ae165831e93': {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin Mainnet',
        nativeCurrency: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
        isEvm: false,
      },
    },
  },
});

const meta: Meta<typeof AddressQRCodeModal> = {
  title: 'Components/MultichainAccounts/AddressQRCodeModal',
  component: AddressQRCodeModal,
  decorators: [
    (Story) => (
      <Provider store={mockStore(createMockState())}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    address: {
      control: 'text',
      description: 'The address to display and generate QR code for',
    },
    chainId: {
      control: 'text',
      description: 'The chain ID for network image and explorer functionality',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AddressQRCodeModal>;

const StoryWrapper = (args: AddressQRCodeModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <AddressQRCodeModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export const EthereumMainnet: Story = {
  args: {
    address: accounts.ethereum.address,
    chainId: '0x1',
    account: accounts.ethereum,
  },
  render: (args) => <StoryWrapper {...args} />,
};

export const PolygonMainnet: Story = {
  args: {
    address: accounts.polygon.address,
    chainId: '0x89',
    account: accounts.polygon,
  },
  render: (args) => <StoryWrapper {...args} />,
};

export const ArbitrumOne: Story = {
  args: {
    address: accounts.arbitrum.address,
    chainId: '0xa4b1',
    account: accounts.arbitrum,
  },
  render: (args) => <StoryWrapper {...args} />,
};

export const SolanaMainnet: Story = {
  args: {
    address: accounts.solana.address,
    chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    account: accounts.solana,
  },
  render: (args) => <StoryWrapper {...args} />,
};

export const BitcoinMainnet: Story = {
  args: {
    address: accounts.bitcoin.address,
    chainId: 'bip122:000000000019d6689c085ae165831e93',
    account: accounts.bitcoin,
  },
  render: (args) => <StoryWrapper {...args} />,
};

export const LongAccountName: Story = {
  args: {
    address: accounts.ethereum.address,
    chainId: '0x1',
    account: {
      ...accounts.ethereum,
      metadata: {
        ...accounts.ethereum.metadata,
        name: 'My Very Long Account Name That Should Be Truncated Properly',
      },
    },
  },
  render: (args) => <StoryWrapper {...args} />,
};

export const WithoutAccount: Story = {
  args: {
    address: '0x1111222233334444555566667777888899990000',
    chainId: '0x1',
    // No account prop provided
  },
  render: (args) => <StoryWrapper {...args} />,
};
