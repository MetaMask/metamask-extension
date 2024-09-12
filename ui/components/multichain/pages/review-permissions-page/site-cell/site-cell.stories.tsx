import React from 'react';
import { ARBITRUM_NOVA_IMAGE_URL } from '../../../../../../shared/constants/network';
import { SiteCell } from './site-cell';

export default {
  title: 'Components/Multichain/SiteCell',
  components: SiteCell,
  argTypes: {
    accounts: { control: 'array' },
    networks: { control: 'array' },
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
    networks: [
      {
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        chainId: '0xa4b1',
        ticker: 'ETH',
        nickname: 'Arbitrum One',
        rpcPrefs: {
          blockExplorerUrl: 'https://arbiscan.io',
          imageUrl: ARBITRUM_NOVA_IMAGE_URL,
        },
        id: 'f8f98123-f3ae-418c-b1e7-d08f057f395c',
        blockExplorerUrl: 'https://arbiscan.io',
        removable: true,
      },
    ],
  },
};

export const DefaultStory = (args) => <SiteCell {...args} />;

DefaultStory.storyName = 'Default';
