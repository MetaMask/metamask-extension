import React from 'react';
import ConfirmationNetworkSwitch from '.';

export default {
  title: 'Components/Pages/Confirmation/Components/ConfirmationNetworkSwitch', // ui/pages/confirmation/components/confirmation-network-switch/confirmation-network-switch.js
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
