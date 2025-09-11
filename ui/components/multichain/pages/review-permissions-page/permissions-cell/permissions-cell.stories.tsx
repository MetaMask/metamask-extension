import React from 'react';
import { PermissionsCell } from './permissions-cell';

export default {
  title: 'Components/Multichain/PermissionsCell',
  component: PermissionsCell,
  argTypes: {
    nonTestNetworks: { control: 'array' },
    testNetworks: { control: 'array' },
    streamsCount: { control: 'number' },
    subscriptionsCount: { control: 'number' },
    streamsChainIds: { control: 'array' },
    subscriptionsChainIds: { control: 'array' },
  },
  args: {
    streamsCount: 5,
    subscriptionsCount: 3,
    streamsChainIds: ['0x1', '0x89', '0xa86a'],
    subscriptionsChainIds: ['0x1', '0x38'],
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
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        caipChainId: 'eip155:1',
      },
      {
        chainId: '0x89',
        rpcEndpoints: [
          {
            networkClientId: 'polygon',
            url: 'https://polygon-rpc.com',
            type: 'rpc',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://polygonscan.com'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Polygon',
        nativeCurrency: 'MATIC',
        caipChainId: 'eip155:89',
      },
      {
        chainId: '0xa86a',
        rpcEndpoints: [
          {
            networkClientId: 'avalanche',
            url: 'https://api.avax.network/ext/bc/C/rpc',
            type: 'rpc',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://snowtrace.io'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Avalanche C-Chain',
        nativeCurrency: 'AVAX',
        caipChainId: 'eip155:43114',
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
        caipChainId: 'eip155:11155111',
      },
      {
        chainId: '0x38',
        rpcEndpoints: [
          {
            networkClientId: 'bsc',
            url: 'https://bsc-dataseed.binance.org',
            type: 'rpc',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://bscscan.com'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'BNB Smart Chain',
        nativeCurrency: 'BNB',
        caipChainId: 'eip155:56',
      },
    ],
  },
};

export const DefaultStory = (args) => <PermissionsCell {...args} />;

DefaultStory.storyName = 'Default';

export const StreamsOnly = (args) => (
  <PermissionsCell
    {...args}
    streamsCount={8}
    subscriptionsCount={0}
    streamsChainIds={['0x1', '0x89', '0xa86a', '0x38']}
    subscriptionsChainIds={[]}
  />
);

export const SubscriptionsOnly = (args) => (
  <PermissionsCell
    {...args}
    streamsCount={0}
    subscriptionsCount={12}
    streamsChainIds={[]}
    subscriptionsChainIds={['0x1', '0x89', '0xa86a', '0x38', '0xaa36a7']}
  />
);

export const NoPermissions = (args) => (
  <PermissionsCell
    {...args}
    streamsCount={0}
    subscriptionsCount={0}
    streamsChainIds={[]}
    subscriptionsChainIds={[]}
  />
);
