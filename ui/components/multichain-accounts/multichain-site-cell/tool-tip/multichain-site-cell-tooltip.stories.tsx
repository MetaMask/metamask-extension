import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AccountGroupType } from '@metamask/account-api';
import { RpcEndpointType } from '@metamask/network-controller';
import { MultichainSiteCellTooltip } from './multichain-site-cell-tooltip';
import type { AccountGroupId } from '@metamask/account-api';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import { CaipChainId } from '@metamask/utils';

export default {
  title: 'Components/MultichainAccounts/MultichainSiteCellTooltip',
  component: MultichainSiteCellTooltip,
  parameters: {
    docs: {
      description: {
        component:
          'A tooltip component showing account and network information with avatar groups',
      },
    },
  },
} as Meta<typeof MultichainSiteCellTooltip>;

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

const mockNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] = [
  {
    name: 'Ethereum Mainnet',
    chainId: '0x1',
    caipChainId: 'eip155:1' as CaipChainId,
    blockExplorerUrls: ['mock-mainnet-url'],
    defaultRpcEndpointIndex: 0,
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: 'mainnet',
        type: RpcEndpointType.Custom,
        url: 'mock-mainnet-url',
      },
    ],
  },
  {
    name: 'Polygon',
    chainId: '0x89',
    caipChainId: 'eip155:137' as CaipChainId,
    blockExplorerUrls: ['mock-polygon-url'],
    defaultRpcEndpointIndex: 0,
    nativeCurrency: 'MATIC',
    rpcEndpoints: [
      {
        networkClientId: 'polygon',
        type: RpcEndpointType.Custom,
        url: 'mock-polygon-url',
      },
    ],
  },
];

const Template: StoryFn<typeof MultichainSiteCellTooltip> = (args) => (
  <div
    style={{
      width: '200px',
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
    }}
  >
    <MultichainSiteCellTooltip {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  accountGroups: mockAccountGroups,
  networks: mockNetworks,
};
