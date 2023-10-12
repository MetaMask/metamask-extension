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
      { symbol: 'ETH', image: './images/eth_logo.png' },
      { symbol: 'MATIC', image: './images/matic-token.png' },
      { symbol: 'OP', image: './images/optimism.svg' },
      { symbol: 'AVAX', image: './images/avax-token.png' },
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
    { symbol: 'ETH', image: './images/eth_logo.png' },
    { symbol: 'MATIC', image: './images/matic-token.png' },
    { symbol: 'OP', image: './images/optimism.svg' },
    { symbol: 'AVAX', image: './images/avax-token.png' },
    { symbol: 'PALM', image: './images/palm.svg' },
  ],
  limit: 2,
};

export const TokenWithOutSrc: StoryFn<typeof AvatarGroup> = (args) => (
  <AvatarGroup {...args} />
);
TokenWithOutSrc.args = {
  members: [
    { symbol: 'ETH', image: '' },
    { symbol: 'MATIC', image: '' },
    { symbol: 'OP', image: '' },
    { symbol: 'AVAX', image: '' },
  ],
  limit: 2,
};
