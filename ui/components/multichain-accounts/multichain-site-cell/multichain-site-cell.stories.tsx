import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AccountGroupType } from '@metamask/account-api';
import { MultichainSiteCell } from './multichain-site-cell';
import type { AccountGroupId } from '@metamask/account-api';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { createMockInternalAccount } from '../../../../test/jest/mocks';

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
  {
    id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Account 1',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 0,
      },
    },
    accounts: [
      createMockInternalAccount({
        id: 'account-1',
        name: 'Account 1',
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      }),
    ],
  },
  {
    id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/1' as AccountGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: 'Account 2',
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: 1,
      },
    },
    accounts: [
      createMockInternalAccount({
        id: 'account-2',
        name: 'Account 2',
        address: '0x123456789abcdef0123456789abcdef012345678',
      }),
    ],
  },
];

const mockNonTestNetworks = [
  {
    name: 'Ethereum Mainnet',
    chainId: '0x1',
    caipChainId: 'eip155:1' as any,
  },
  {
    name: 'Polygon',
    chainId: '0x89',
    caipChainId: 'eip155:137' as any,
  },
];

const mockTestNetworks = [
  {
    name: 'Sepolia',
    chainId: '0xaa36a7',
    caipChainId: 'eip155:11155111' as any,
  },
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
  (_, index) => ({
    id: `entropy:01JKAF3DSGM3AB87EM9N0K41AJ/${index}` as AccountGroupId,
    type: AccountGroupType.MultichainAccount,
    metadata: {
      name: `Account ${index + 1}`,
      pinned: false,
      hidden: false,
      entropy: {
        groupIndex: index,
      },
    },
    accounts: [
      createMockInternalAccount({
        id: `account-${index + 1}`,
        name: `Account ${index + 1}`,
        address: `0x${(index + 1).toString().padStart(40, '0')}`,
      }),
    ],
  }),
);

const mockManyNonTestNetworks = [
  {
    name: 'Ethereum Mainnet',
    chainId: '0x1',
    caipChainId: 'eip155:1' as any,
  },
  {
    name: 'Polygon',
    chainId: '0x89',
    caipChainId: 'eip155:137' as any,
  },
  {
    name: 'Binance Smart Chain',
    chainId: '0x38',
    caipChainId: 'eip155:56' as any,
  },
  {
    name: 'Avalanche',
    chainId: '0xa86a',
    caipChainId: 'eip155:43114' as any,
  },
  {
    name: 'Arbitrum One',
    chainId: '0xa4b1',
    caipChainId: 'eip155:42161' as any,
  },
  {
    name: 'Optimism',
    chainId: '0xa',
    caipChainId: 'eip155:10' as any,
  },
  {
    name: 'Fantom',
    chainId: '0xfa',
    caipChainId: 'eip155:250' as any,
  },
  {
    name: 'Cronos',
    chainId: '0x19',
    caipChainId: 'eip155:25' as any,
  },
  {
    name: 'Gnosis Chain',
    chainId: '0x64',
    caipChainId: 'eip155:100' as any,
  },
  {
    name: 'Moonbeam',
    chainId: '0x504',
    caipChainId: 'eip155:1284' as any,
  },
  {
    name: 'Harmony',
    chainId: '0x63564c40',
    caipChainId: 'eip155:1666600000' as any,
  },
];

const mockManyTestNetworks = [
  {
    name: 'Sepolia',
    chainId: '0xaa36a7',
    caipChainId: 'eip155:11155111' as any,
  },
  {
    name: 'Goerli',
    chainId: '0x5',
    caipChainId: 'eip155:5' as any,
  },
  {
    name: 'Mumbai',
    chainId: '0x13881',
    caipChainId: 'eip155:80001' as any,
  },
  {
    name: 'BSC Testnet',
    chainId: '0x61',
    caipChainId: 'eip155:97' as any,
  },
  {
    name: 'Avalanche Fuji',
    chainId: '0xa869',
    caipChainId: 'eip155:43113' as any,
  },
  {
    name: 'Arbitrum Goerli',
    chainId: '0x66eed',
    caipChainId: 'eip155:421613' as any,
  },
  {
    name: 'Optimism Goerli',
    chainId: '0x1a4',
    caipChainId: 'eip155:420' as any,
  },
  {
    name: 'Fantom Testnet',
    chainId: '0xfa2',
    caipChainId: 'eip155:4002' as any,
  },
  {
    name: 'Cronos Testnet',
    chainId: '0x152',
    caipChainId: 'eip155:338' as any,
  },
  {
    name: 'Moonbase Alpha',
    chainId: '0x507',
    caipChainId: 'eip155:1287' as any,
  },
];

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
