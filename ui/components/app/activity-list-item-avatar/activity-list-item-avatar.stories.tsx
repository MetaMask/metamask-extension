import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { ChainBadge } from '../chain-badge/chain-badge';
import { ActivityListItemAvatar } from './activity-list-item-avatar';
import type {
  ActivityListItemAvatarConfig,
  ResolvedActivityToken,
} from './activity-list-item-avatar.types';

const ethToken: ResolvedActivityToken = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: 'ETH',
  chainId: '0x1',
  fallbackName: 'Ethereum',
  imageUrl: './images/eth_logo.svg',
};

const usdcToken: ResolvedActivityToken = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  chainId: '0x1',
  fallbackName: 'Ethereum',
  imageUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
};

const dualConfig: ActivityListItemAvatarConfig = {
  variant: 'dual',
  from: ethToken,
  to: usdcToken,
};

const singleConfig: ActivityListItemAvatarConfig = {
  variant: 'single',
  token: usdcToken,
};

export default {
  title: 'Components/App/ActivityListItemAvatar',
  component: ActivityListItemAvatar,
  argTypes: {
    config: {
      control: 'object',
    },
  },
} as Meta<typeof ActivityListItemAvatar>;

const Template: StoryFn<typeof ActivityListItemAvatar> = ({ config }) => (
  <ActivityListItemAvatar config={config} />
);

export const SingleTokenStory = Template.bind({});
SingleTokenStory.storyName = 'Single token';
SingleTokenStory.args = {
  config: singleConfig,
};

export const DualTokenStory = Template.bind({});
DualTokenStory.storyName = 'Dual token';
DualTokenStory.args = {
  config: dualConfig,
};

export const WithChainBadgeStory: StoryFn<
  typeof ActivityListItemAvatar
> = () => (
  <ChainBadge chainId="0x1">
    <ActivityListItemAvatar config={dualConfig} />
  </ChainBadge>
);
WithChainBadgeStory.storyName = 'With chain badge';

export const WithoutImageStory = Template.bind({});
WithoutImageStory.storyName = 'Without image';
WithoutImageStory.args = {
  config: {
    variant: 'single',
    token: {
      ...usdcToken,
      imageUrl: undefined,
    },
  },
};
