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
      { symbol: 'ETH', iconUrl: './images/eth_logo.png' },
      { symbol: 'MATIC', iconUrl: './images/matic-token.png' },
      { symbol: 'OP', iconUrl: './images/optimism.svg' },
      { symbol: 'AVAX', iconUrl: './images/avax-token.png' },
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
    { symbol: 'ETH', iconUrl: './images/eth_logo.png' },
    { symbol: 'MATIC', iconUrl: './images/matic-token.png' },
    { symbol: 'OP', iconUrl: './images/optimism.svg' },
    { symbol: 'AVAX', iconUrl: './images/avax-token.png' },
    { symbol: 'PALM', iconUrl: './images/palm.svg' },
  ],
  limit: 2,
};

export const TokenWithOutSrc: StoryFn<typeof AvatarGroup> = (args) => (
  <AvatarGroup {...args} />
);
TokenWithOutSrc.args = {
  members: [
    { symbol: 'ETH', iconUrl: '' },
    { symbol: 'MATIC', iconUrl: '' },
    { symbol: 'OP', iconUrl: '' },
    { symbol: 'AVAX', iconUrl: '' },
  ],
  limit: 2,
};
