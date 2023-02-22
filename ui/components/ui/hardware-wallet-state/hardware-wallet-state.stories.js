import React from 'react';
import HardwareWalletState from '.';

export default {
  title: 'Components/App/HardwareWalletState',
  argTypes: {
    pollingRateMs: {
      control: 'number',
    },
    initialStatus: {
      control: 'text',
    },
    onUpdate: {
      action: 'onUpdate',
    },
  },

  args: {
    pollingRateMs: 2000,
    initialStatus: 'locked',
  },
};

export const DefaultStory = (args) => <HardwareWalletState {...args} />;

DefaultStory.storyName = 'Default';
