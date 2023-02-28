import React from 'react';
import HardwareWalletState from '.';

export default {
  title: 'Components/App/HardwareWalletState',
  argTypes: {
    pollingRateMs: {
      control: 'number',
    },
    initialStatus: {
      control: 'select',
      options: ['locked', 'unlocked'],
    },
    onUpdate: {
      action: 'onUpdate',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    pollingRateMs: 2000,
    initialStatus: 'locked',
  },
};

export const DefaultStory = (args) => <HardwareWalletState {...args} />;

DefaultStory.storyName = 'Default';
