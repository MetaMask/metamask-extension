import React from 'react';
import HardwareWalletState from '.';

export default {
  title: 'Components/App/HardwareWalletState',

  argTypes: {
    device: {
      control: 'text',
    },
    hdPath: {
      control: 'text',
    },
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
    device: 'ledger',
    hdPath: `m/44'/60'/0'/0/0`,
    pollingRateMs: 2000,
    initialStatus: 'locked',
  },
};

export const DefaultStory = (args) => <HardwareWalletState {...args} />;

DefaultStory.storyName = 'Default';
