import React from 'react';
import type { Meta, StoryFn } from '@storybook/react';
import { ChainBadge } from '../chain-badge/chain-badge';
import {
  ActivityListItemAvatar,
  type ActivityListItemAvatarTokens,
} from './activity-list-item-avatar';

const dualTokens: ActivityListItemAvatarTokens = [
  'eip155:1/slip44:60',
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
];

const singleTokens: ActivityListItemAvatarTokens = [
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
];

export default {
  title: 'Components/App/ActivityListItemAvatar',
  component: ActivityListItemAvatar,
  argTypes: {
    tokens: {
      control: 'object',
    },
  },
} as Meta<typeof ActivityListItemAvatar>;

const Template: StoryFn<typeof ActivityListItemAvatar> = ({ tokens }) => (
  <ActivityListItemAvatar tokens={tokens} />
);

export const SingleTokenStory = Template.bind({});
SingleTokenStory.storyName = 'Single token';
SingleTokenStory.args = {
  tokens: singleTokens,
};

export const DualTokenStory = Template.bind({});
DualTokenStory.storyName = 'Dual token';
DualTokenStory.args = {
  tokens: dualTokens,
};

export const WithChainBadgeStory: StoryFn<
  typeof ActivityListItemAvatar
> = () => (
  <ChainBadge chainId="0x1">
    <ActivityListItemAvatar tokens={dualTokens} />
  </ChainBadge>
);
WithChainBadgeStory.storyName = 'With chain badge';

export const WithoutImageStory = Template.bind({});
WithoutImageStory.storyName = 'Without image';
WithoutImageStory.args = {
  tokens: ['eip155:1/erc20:0x1111111111111111111111111111111111111111'],
};
