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
      chainId: 'chainId',
      name: 'Binance Smart Chain Mainnet',
    },
  },
};

export const DefaultStory = (args) => <ConfirmationNetworkSwitch {...args} />;

DefaultStory.storyName = 'Default';
