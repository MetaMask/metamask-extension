import React from 'react';
import { EditNetworksModal } from '.';

export default {
  title: 'Components/Multichain/EditNetworksModal',
  component: EditNetworksModal,
  argTypes: {
    combinedNetworks: {
      control: 'array',
    },
  },
  args: {
    combinedNetworks: [
      {
        chainId: '0x1',
        nickname: 'Ethereum Mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/cb3fa73a8bdf4342b8ed8b07e0740be9',
        rpcPrefs: {
          imageUrl: './images/eth_logo.svg',
        },
        providerType: 'mainnet',
        ticker: 'ETH',
        id: 'mainnet',
        removable: false,
        blockExplorerUrl: 'https://etherscan.io',
      },
      {
        chainId: '0xe708',
        nickname: 'Linea Mainnet',
        rpcUrl:
          'https://linea-mainnet.infura.io/v3/cb3fa73a8bdf4342b8ed8b07e0740be9',
        rpcPrefs: {
          imageUrl: './images/linea-logo-mainnet.svg',
        },
        providerType: 'linea-mainnet',
        ticker: 'ETH',
        id: 'linea-mainnet',
        removable: false,
        blockExplorerUrl: 'https://lineascan.build',
      },
      {
        rpcUrl: 'https://mainnet.base.org',
        chainId: '0x2105',
        ticker: 'ETH',
        nickname: 'Base',
        rpcPrefs: {
          blockExplorerUrl: 'https://basescan.org',
          imageUrl: './images/base.svg',
        },
        id: '61bb70f8-6583-42aa-8547-ef6c044614ad',
        blockExplorerUrl: 'https://basescan.org',
        removable: true,
      },
      {
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        chainId: '0xa4b1',
        ticker: 'ETH',
        nickname: 'Arbitrum One',
        rpcPrefs: {
          blockExplorerUrl: 'https://arbiscan.io',
          imageUrl: './images/arbitrum.svg',
        },
        id: 'f8f98123-f3ae-418c-b1e7-d08f057f395c',
        blockExplorerUrl: 'https://arbiscan.io',
        removable: true,
      },
    ],
  },
};

export const DefaultStory = (args) => <EditNetworksModal {...args} />;

DefaultStory.storyName = 'Default';
