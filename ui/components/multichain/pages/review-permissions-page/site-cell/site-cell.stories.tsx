import React from 'react';
import { SiteCell } from './site-cell';

export default {
  title: 'Components/Multichain/SiteCell',
  component: SiteCell,
  argTypes: {
    accounts: { control: 'array' },
    nonTestNetworks: { control: 'array' },
    testNetworks: { control: 'array' },
  },
  args: {
    accounts: [
      {
        id: '689821df-0e8f-4093-bbbb-b95cf0fa79cb',
        address: '0x860092756917d3e069926ba130099375eeeb9440',
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {
          name: 'Account 1',
          importTime: 1726046726882,
          keyring: {
            type: 'HD Key Tree',
          },
          lastSelected: 1726046726882,
        },
        balance: '0x00',
      },
    ],
    selectedAccountAddresses: ['0x860092756917d3e069926ba130099375eeeb9440'],
    selectedChainIds: ['0x1', '0xe708', '0x144', '0x89', '0x38'],
    activeTabOrigin: 'https://app.uniswap.org',
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
      {
        chainId: '0xe705',
        rpcEndpoints: [
          {
            networkClientId: 'linea-sepolia',
            url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.lineascan.build'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Linea Sepolia',
        nativeCurrency: 'LineaETH',
      },
    ],
  },
};

export const DefaultStory = (args) => <SiteCell {...args} />;

DefaultStory.storyName = 'Default';
