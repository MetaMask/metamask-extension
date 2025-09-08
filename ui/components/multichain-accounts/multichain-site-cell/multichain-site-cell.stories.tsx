import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AccountGroupType } from '@metamask/account-api';
import { RpcEndpointType } from '@metamask/network-controller';
import { MultichainSiteCell } from './multichain-site-cell';
import type { AccountGroupId } from '@metamask/account-api';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { CaipChainId, Hex } from '@metamask/utils';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../selectors/selectors.types';

// Helper function to create mock network configurations
const createMockNetwork = (
  name: string,
  chainId: Hex,
  caipChainId: CaipChainId,
  nativeCurrency: string,
  networkClientId: string,
  mockUrl?: string,
): EvmAndMultichainNetworkConfigurationsWithCaipChainId => {
  const url = mockUrl || `mock-${networkClientId}-url`;
  return {
    name,
    chainId,
    caipChainId,
    blockExplorerUrls: [url],
    defaultRpcEndpointIndex: 0,
    nativeCurrency,
    rpcEndpoints: [
      {
        networkClientId,
        type: RpcEndpointType.Custom,
        url,
      },
    ],
  };
};

// Helper function to create mock account groups
const createMockAccountGroup = (
  index: number,
  name?: string,
): AccountGroupWithInternalAccounts => ({
  id: `entropy:01JKAF3DSGM3AB87EM9N0K41AJ/${index}` as AccountGroupId,
  type: AccountGroupType.MultichainAccount,
  metadata: {
    name: name || `Account ${index + 1}`,
    pinned: false,
    hidden: false,
    entropy: {
      groupIndex: index,
    },
  },
  accounts: [
    createMockInternalAccount({
      id: `account-${index + 1}`,
      name: name || `Account ${index + 1}`,
      address:
        index === 0
          ? '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
          : `0x${(index + 1).toString().padStart(40, '0')}`,
    }),
  ],
});

// Network configurations for many networks stories
const MAINNET_NETWORKS = [
  {
    name: 'Ethereum',
    chainId: '0x1' as Hex,
    caipChainId: 'eip155:1',
    currency: 'ETH',
    clientId: 'mainnet',
  },
  {
    name: 'Polygon',
    chainId: '0x89' as Hex,
    caipChainId: 'eip155:137',
    currency: 'MATIC',
    clientId: 'polygon',
  },
  {
    name: 'BNB Chain',
    chainId: '0x38' as Hex,
    caipChainId: 'eip155:56',
    currency: 'BNB',
    clientId: 'bsc',
  },
  {
    name: 'Avalanche',
    chainId: '0xa86a' as Hex,
    caipChainId: 'eip155:43114',
    currency: 'AVAX',
    clientId: 'avalanche',
  },
  {
    name: 'Arbitrum',
    chainId: '0xa4b1' as Hex,
    caipChainId: 'eip155:42161',
    currency: 'ETH',
    clientId: 'arbitrum',
  },
  {
    name: 'Optimism',
    chainId: '0xa' as Hex,
    caipChainId: 'eip155:10',
    currency: 'ETH',
    clientId: 'optimism',
  },
  {
    name: 'Fantom',
    chainId: '0xfa' as Hex,
    caipChainId: 'eip155:250',
    currency: 'FTM',
    clientId: 'fantom',
  },
  {
    name: 'Cronos',
    chainId: '0x19' as Hex,
    caipChainId: 'eip155:25',
    currency: 'CRO',
    clientId: 'cronos',
  },
  {
    name: 'Gnosis Chain',
    chainId: '0x64' as Hex,
    caipChainId: 'eip155:100',
    currency: 'xDAI',
    clientId: 'gnosis',
  },
  {
    name: 'Moonbeam',
    chainId: '0x504' as Hex,
    caipChainId: 'eip155:1284',
    currency: 'GLMR',
    clientId: 'moonbeam',
  },
  {
    name: 'Harmony',
    chainId: '0x63564c40' as Hex,
    caipChainId: 'eip155:1666600000',
    currency: 'ONE',
    clientId: 'harmony',
  },
];

const TESTNET_NETWORKS = [
  {
    name: 'Sepolia',
    chainId: '0xaa36a7' as Hex,
    caipChainId: 'eip155:11155111',
    currency: 'SEP',
    clientId: 'sepolia',
    url: 'mock-sepolia-url',
  },
  {
    name: 'Goerli',
    chainId: '0x5' as Hex,
    caipChainId: 'eip155:5',
    currency: 'GoerliETH',
    clientId: 'goerli',
    url: 'mock-goerli-url',
  },
  {
    name: 'Mumbai',
    chainId: '0x13881' as Hex,
    caipChainId: 'eip155:80001',
    currency: 'MATIC',
    clientId: 'mumbai',
    url: 'mock-mumbai-url',
  },
  {
    name: 'BSC Testnet',
    chainId: '0x61' as Hex,
    caipChainId: 'eip155:97',
    currency: 'tBNB',
    clientId: 'bsc-testnet',
    url: 'mock-bsc-testnet-url',
  },
  {
    name: 'Avalanche Fuji',
    chainId: '0xa869' as Hex,
    caipChainId: 'eip155:43113',
    currency: 'AVAX',
    clientId: 'fuji',
    url: 'mock-fuji-url',
  },
  {
    name: 'Arbitrum Goerli',
    chainId: '0x66eed' as Hex,
    caipChainId: 'eip155:421613',
    currency: 'AGOR',
    clientId: 'arbitrum-goerli',
    url: 'mock-arbitrum-goerli-url',
  },
  {
    name: 'Optimism Goerli',
    chainId: '0x1a4' as Hex,
    caipChainId: 'eip155:420',
    currency: 'ETH',
    clientId: 'optimism-goerli',
    url: 'mock-optimism-goerli-url',
  },
  {
    name: 'Fantom Testnet',
    chainId: '0xfa2' as Hex,
    caipChainId: 'eip155:4002',
    currency: 'FTM',
    clientId: 'fantom-testnet',
    url: 'mock-fantom-testnet-url',
  },
  {
    name: 'Cronos Testnet',
    chainId: '0x152' as Hex,
    caipChainId: 'eip155:338',
    currency: 'TCRO',
    clientId: 'cronos-testnet',
    url: 'mock-cronos-testnet-url',
  },
  {
    name: 'Moonbase Alpha',
    chainId: '0x507' as Hex,
    caipChainId: 'eip155:1287',
    currency: 'DEV',
    clientId: 'moonbase',
    url: 'mock-moonbase-url',
  },
];

export default {
  title: 'Components/MultichainAccounts/MultichainSiteCell',
  component: MultichainSiteCell,
  parameters: {
    docs: {
      description: {
        component:
          'A component for displaying site permissions for accounts and networks',
      },
    },
  },
  argTypes: {
    onSelectAccountGroupIds: { action: 'onSelectAccountGroupIds' },
    onSelectChainIds: { action: 'onSelectChainIds' },
    hideAllToasts: { action: 'hideAllToasts' },
  },
} as Meta<typeof MultichainSiteCell>;

const mockAccountGroups: AccountGroupWithInternalAccounts[] = [
  createMockAccountGroup(0, 'Account 1'),
  createMockAccountGroup(1, 'Account 2'),
];

const mockNonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
  [
    createMockNetwork(
      'Ethereum',
      '0x1' as Hex,
      'eip155:1' as CaipChainId,
      'ETH',
      'mainnet',
    ),
    createMockNetwork(
      'Polygon',
      '0x89' as Hex,
      'eip155:137' as CaipChainId,
      'MATIC',
      'polygon-mainnet',
      'mock-polygon-url',
    ),
  ];

const mockTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
  [
    createMockNetwork(
      'Sepolia',
      '0xaa36a7' as Hex,
      'eip155:11155111' as CaipChainId,
      'SEP',
      'sepolia',
    ),
  ];

const Template: StoryFn<typeof MultichainSiteCell> = (args) => (
  <div
    style={{
      width: '400px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
    }}
  >
    <MultichainSiteCell {...args} />
  </div>
);

const mockManyAccountGroups: AccountGroupWithInternalAccounts[] = Array.from(
  { length: 12 },
  (_, index) => createMockAccountGroup(index),
);

const mockManyNonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
  MAINNET_NETWORKS.map(({ name, chainId, caipChainId, currency, clientId }) =>
    createMockNetwork(
      name,
      chainId,
      caipChainId as CaipChainId,
      currency,
      clientId,
    ),
  );

const mockManyTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
  TESTNET_NETWORKS.map(
    ({ name, chainId, caipChainId, currency, clientId, url }) =>
      createMockNetwork(
        name,
        chainId,
        caipChainId as CaipChainId,
        currency,
        clientId,
        url,
      ),
  );

export const Default = Template.bind({});
Default.args = {
  nonTestNetworks: mockNonTestNetworks,
  testNetworks: mockTestNetworks,
  supportedAccountGroups: mockAccountGroups,
  selectedAccountGroupIds: [mockAccountGroups[0].id, mockAccountGroups[1].id],
  selectedChainIds: [
    mockNonTestNetworks[0].caipChainId,
    mockNonTestNetworks[1].caipChainId,
  ],
  isConnectFlow: false,
};

export const ManyAccountsAndNetworks = Template.bind({});
ManyAccountsAndNetworks.args = {
  nonTestNetworks: mockManyNonTestNetworks,
  testNetworks: mockManyTestNetworks,
  supportedAccountGroups: mockManyAccountGroups,
  selectedAccountGroupIds: mockManyAccountGroups
    .slice(0, 7)
    .map((group) => group.id),
  selectedChainIds: [
    ...mockManyNonTestNetworks
      .slice(0, 6)
      .map((network) => network.caipChainId),
    ...mockManyTestNetworks.slice(0, 4).map((network) => network.caipChainId),
  ],
  isConnectFlow: false,
};

export const NoAccountsAndNetworks = Template.bind({});
NoAccountsAndNetworks.args = {
  nonTestNetworks: [],
  testNetworks: [],
  supportedAccountGroups: [],
  selectedAccountGroupIds: [],
  selectedChainIds: [],
  isConnectFlow: false,
};
