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
    onChange: {
      action: 'onChange',
    },
    onLock: {
      action: 'onLock',
    },
    onUnlock: {
      action: 'onUnlock',
    },
  },

  args: {
    device: 'ledger',
    hdPath: `m/44'/60'/0'/0/0`,
    pollingRateMs: 2000,
  },
};

export const DefaultStory = (args) => <HardwareWalletState {...args} />;

DefaultStory.storyName = 'Default';
