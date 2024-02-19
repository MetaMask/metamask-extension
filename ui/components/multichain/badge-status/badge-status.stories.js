import React from 'react';
import { BadgeStatus } from './badge-status';

export default {
  title: 'Components/Multichain/BadgeStatus',
  component: BadgeStatus,
  argTypes: {
    text: {
      control: 'text',
    },
    address: {
      control: 'text',
    },
    isActive: {
      control: 'boolean',
    },
  },
  args: {
    address: '0x1',
    isActive: false,
  },
};

const Template = (args) => {
  return <BadgeStatus {...args} />;
};

export const DefaultStory = Template.bind({});
