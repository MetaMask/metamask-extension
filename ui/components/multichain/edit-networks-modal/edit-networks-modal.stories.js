import React from 'react';
import { EditNetworksModal } from '.';

export default {
  title: 'Components/Multichain/EditNetworksModal',
  component: EditNetworksModal,
  argTypes: {
    nonTestNetworks: {
      control: 'array',
    },
    testNetworks: {
      control: 'array',
    },
    activeTabOrigin: {
      control: 'text',
    },
    defaultSelectedChainIds: {
      control: 'array',
    },
  },
  args: {
    nonTestNetworks: [
      {
        chainId: '0x1',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Ethereum',
        nativeCurrency: 'ETH',
      },
    ],
    testNetworks: [
      {
        chainId: '0xaa36a7',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Sepolia',
        nativeCurrency: 'SepoliaETH',
      },
    ],
    activeTabOrigin: 'https://app.uniswap.org',
    defaultSelectedChainIds: ['0x1'],
  },
};

export const DefaultStory = (args) => <EditNetworksModal {...args} />;

DefaultStory.storyName = 'Default';
