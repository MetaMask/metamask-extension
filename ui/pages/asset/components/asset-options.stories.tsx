import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AssetOptions from './asset-options';

const meta: Meta<typeof AssetOptions> = {
  title: 'Pages/Asset/AssetOptions',
  component: AssetOptions,
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssetOptions>;

export const Default: Story = {
  args: {
    isNativeAsset: false,
    token: {
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      symbol: 'DAI',
      decimals: 18,
      chainId: '0x1',
    },
    onRemove: () => console.log('Token removed'),
    onClickBlockExplorer: () => console.log('Block explorer clicked'),
    onViewTokenDetails: () => console.log('Token details clicked'),
  },
};
