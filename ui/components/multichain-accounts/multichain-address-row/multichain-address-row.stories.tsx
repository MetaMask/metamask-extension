import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MultichainAddressRow } from './multichain-address-row';

const meta: Meta<typeof MultichainAddressRow> = {
  title: 'Components/MultichainAccounts/MultichainAddressRow',
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
    chainId: {
      control: 'text',
      description: 'Chain ID to identify the network',
    },
    networkName: {
      control: 'text',
      description: 'Network name to display',
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
    chainId: '0x1',
    networkName: 'Ethereum Mainnet',
    address: '0x1234567890123456789012345678901234567890',
    className: '',
  },
};

export const WithLongNetworkName: Story = {
  args: {
    chainId: '0x13881',
    networkName: 'Polygon Mumbai Testnet',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    className: '',
  },
};

export const ArbitrumNetwork: Story = {
  args: {
    chainId: '0xa4b1',
    networkName: 'Arbitrum One',
    address: '0x0123456789abcdef0123456789abcdef01234567',
    className: '',
  },
};

export const OptimismNetwork: Story = {
  args: {
    chainId: '0xa',
    networkName: 'Optimism',
    address: '0x9876543210987654321098765432109876543210',
    className: '',
  },
};

export const PolygonNetwork: Story = {
  args: {
    chainId: '0x89',
    networkName: 'Polygon',
    address: '0xfedcba0987654321fedcba0987654321fedcba09',
    className: '',
  },
};

export const CustomNetwork: Story = {
  args: {
    chainId: '0x539',
    networkName: 'Custom Network',
    address: '0x1111222233334444555566667777888899990000',
    className: '',
  },
};
