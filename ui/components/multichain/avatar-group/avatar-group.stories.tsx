import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AvatarGroup } from '.';

export default {
  title: 'Components/Multichain/AvatarGroup',
  component: AvatarGroup,
  argTypes: {
    limit: {
      control: 'number',
    },
    members: {
      control: 'object',
    },
  },
  args: {
    members: [
      { symbol: 'ETH', avatarValue: './images/eth_logo.svg' },
      { symbol: 'MATIC', avatarValue: './images/matic-token.svg' },
      { symbol: 'OP', avatarValue: './images/optimism.svg' },
      { symbol: 'AVAX', avatarValue: './images/avax-token.svg' },
    ],
    limit: 4,
  },
} as Meta<typeof AvatarGroup>;

const Template = (args) => <AvatarGroup {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const WithTag: StoryFn<typeof AvatarGroup> = (args) => (
  <AvatarGroup {...args} />
);
WithTag.args = {
  members: [
    { symbol: 'ETH', avatarValue: './images/eth_logo.svg' },
    { symbol: 'MATIC', avatarValue: './images/matic-token.svg' },
    { symbol: 'OP', avatarValue: './images/optimism.svg' },
    { symbol: 'AVAX', avatarValue: './images/avax-token.svg' },
    { symbol: 'PALM', avatarValue: './images/palm.svg' },
  ],
  limit: 2,
};

export const TokenWithOutSrc: StoryFn<typeof AvatarGroup> = (args) => (
  <AvatarGroup {...args} />
);
TokenWithOutSrc.args = {
  members: [
    { symbol: 'ETH', avatarValue: '' },
    { symbol: 'MATIC', avatarValue: '' },
    { symbol: 'OP', avatarValue: '' },
    { symbol: 'AVAX', avatarValue: '' },
  ],
  limit: 2,
};
