import React from 'react';
import ConfirmationNetworkSwitch from '.';

export default {
  title: 'Pages/Confirmation/Components/ConfirmationNetworkSwitch',
  argTypes: {
    newNetwork: {
      controls: 'object',
    },
  },
  args: {
    newNetwork: {
      chainId: '0xa',
      ticker: 'ETH',
      nickname: 'Optimism',
      rpcUrl: 'https://optimism-mainnet.infura.io',
    },
  },
};

export const DefaultStory = (args) => <ConfirmationNetworkSwitch {...args} />;

DefaultStory.storyName = 'Default';
