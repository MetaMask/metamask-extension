import React from 'react';
import ConfirmationNetworkSwitch from '.';

export default {
  title: 'Pages/Confirmation/Components/ConfirmationNetworkSwitch',
  id: __filename,
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
