import React from 'react';
import ConfirmationNetworkSwitch from '.';

export default {
  title: 'Pages/Confirmation/Components/ConfirmationNetworkSwitch',

  argTypes: {
    toNetwork: {
      controls: 'object',
    },
    fromNetwork: {
      controls: 'object',
    },
  },
  args: {
    toNetwork: {
      chainId: 'chainId',
      nickname: 'Binance Smart Chain Mainnet',
    },
    fromNetwork: {
      chainId: '1',
      nickname: 'Ethereum Mainnet',
    },
  },
};

export const DefaultStory = (args) => <ConfirmationNetworkSwitch {...args} />;

DefaultStory.storyName = 'Default';
