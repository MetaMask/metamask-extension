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
      { label: 'Eth', src: './images/eth_logo.png' },
      { label: 'Matic', src: './images/matic-token.png' },
      { label: 'Palm', src: './images/palm.svg' },
      { label: 'Avalanche', src: './images/avax-token.png' },
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
    { label: 'Eth', src: './images/eth_logo.png' },
    { label: 'Matic', src: './images/matic-token.png' },
    { label: 'Palm', src: './images/palm.svg' },
    { label: 'Avalanche', src: './images/avax-token.png' },
    { label: 'Optimism', src: './images/optimism.svg' },
  ],
  limit: 2,
};

export const TokenWithOutSrc: StoryFn<typeof AvatarGroup> = (args) => (
  <AvatarGroup {...args} />
);
TokenWithOutSrc.args = {
  members: [
    { label: 'Eth', src: '' },
    { label: 'Matic', src: '' },
    { label: 'Palm', src: '' },
    { label: 'Avalanche', src: '' },
  ],
  limit: 2,
};
