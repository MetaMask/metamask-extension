import React from 'react';

import SendContent from './send-content.component';

export default {
  title: 'Pages/Send/SendContent',
  id: __filename,
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
  contact: { name: 'testName' },
  networkOrAccountNotSupports1559: false,
  getIsBalanceInsufficient: false,
  to: 'string to',
  assetError: 'newAccountDetectedDialogMessage',
};
