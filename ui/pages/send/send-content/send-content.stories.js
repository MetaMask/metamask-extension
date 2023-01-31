import React from 'react';

import SendContent from './send-content.component';

export default {
  title: 'Pages/Send/SendContent',

  argsTypes: {
    showHexData: {
      control: 'boolean',
    },
    isOwnedAccount: {
      control: 'boolean',
    },
    contact: {
      control: 'object',
    },
    noGasPrice: {
      control: 'boolean',
    },
    isEthGasPrice: {
      control: 'boolean',
    },

    gasIsExcessive: {
      control: 'boolean',
    },
    networkOrAccountNotSupports1559: {
      control: 'boolean',
    },
    getIsBalanceInsufficient: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
    warning: {
      control: 'text',
    },
    to: {
      control: 'text',
    },
    assetError: {
      control: 'text',
    },
    asset: {
      control: 'object',
    },
    recipient: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => {
  return <SendContent {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  showHexData: false,
  isOwnedAccount: true,
  noGasPrice: false,
  isEthGasPrice: false,
  gasIsExcessive: false,
  error: 'connecting',
  warning: 'connecting',
  asset: {
    type: 'NATIVE',
  },
  recipient: {
    mode: 'CONTACT_LIST',
    userInput: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
    address: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
    nickname: 'John Doe',
    error: null,
    warning: null,
  },
  contact: { name: 'testName' },
  networkOrAccountNotSupports1559: false,
  getIsBalanceInsufficient: false,
  to: 'string to',
  assetError: null,
};
