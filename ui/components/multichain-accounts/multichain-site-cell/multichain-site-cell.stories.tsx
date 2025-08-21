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
