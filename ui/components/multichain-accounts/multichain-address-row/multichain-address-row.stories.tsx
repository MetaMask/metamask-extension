import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { KnownCaipNamespace, CaipChainId } from '@metamask/utils';
import { MultichainAddressRow } from './multichain-address-row';

const meta: Meta<typeof MultichainAddressRow> = {
  title: 'Components/Multichain/MultichainAddressRow',
  component: MultichainAddressRow,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a network icon, network name, truncated address, and action buttons (copy and QR code).',
      },
    },
  },
  argTypes: {
    network: {
      control: 'object',
      description: 'MultichainNetwork object containing nickname, chainId, and rpcPrefs with imageUrl',
    },
    address: {
      control: 'text',
      description: 'Address string to display (will be truncated)',
    },
    className: {
      control: 'text',
      description: 'Optional className for additional styling',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    network: {
      nickname: 'Ethereum Mainnet',
      isEvmNetwork: true,
      chainId: `${KnownCaipNamespace.Eip155}:1` as CaipChainId,
      network: {
        type: 'mainnet',
        chainId: '0x1',
        ticker: 'ETH',
        rpcPrefs: {
          imageUrl: './images/eth_logo.svg',
        },
      },
    },
    address: '0x1234567890123456789012345678901234567890',
    className: '',
  },
};

export const WithLongNetworkName: Story = {
  args: {
    network: {
      nickname: 'Polygon Mumbai Testnet',
      isEvmNetwork: true,
      chainId: `${KnownCaipNamespace.Eip155}:80001` as CaipChainId,
      network: {
        type: 'rpc',
        chainId: '0x13881',
        ticker: 'MATIC',
        rpcPrefs: {
          imageUrl: './images/pol-token.svg',
        },
      },
    },
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    className: '',
  },
};

export const WithoutNetworkImage: Story = {
  args: {
    network: {
      nickname: 'Custom Network',
      isEvmNetwork: true,
      chainId: `${KnownCaipNamespace.Eip155}:1337` as CaipChainId,
      network: {
        type: 'rpc',
        chainId: '0x539',
        ticker: 'ETH',
        rpcPrefs: {},
      },
    },
    address: '0x9876543210987654321098765432109876543210',
    className: '',
  },
};

export const ArbitrumNetwork: Story = {
  args: {
    network: {
      nickname: 'Arbitrum One',
      isEvmNetwork: true,
      chainId: `${KnownCaipNamespace.Eip155}:42161` as CaipChainId,
      network: {
        type: 'rpc',
        chainId: '0xa4b1',
        ticker: 'ETH',
        rpcPrefs: {
          imageUrl: './images/arbitrum.svg',
        },
      },
    },
    address: '0x0123456789abcdef0123456789abcdef01234567',
    className: '',
  },
};