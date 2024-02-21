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
      chainId: '0xa',
      ticker: 'OP',
      nickname: 'Optimism',
      rpcUrl: 'https://optimism-mainnet.infura.io',
    },
    fromNetwork: {
      chainId: '1',
      ticker: 'ETH',
      nickname: 'Ethereum Mainnet',
    },
  },
};

export const DefaultStory = (args) => <ConfirmationNetworkSwitch {...args} />;

DefaultStory.storyName = 'Default';
