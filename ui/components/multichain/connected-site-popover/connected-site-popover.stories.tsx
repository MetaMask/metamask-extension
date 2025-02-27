import React from 'react';
import { ConnectedSitePopover } from './connected-site-popover';

export default {
  title: 'Components/Multichain/ConnectedSitePopover',
  component: ConnectedSitePopover,
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    isOpen: true,
    networkImageUrl: './images/eth_logo.svg',
    networkName: 'Avalanche Network C-Chain',
  },
};

const Template = (args) => {
  return <ConnectedSitePopover {...args} />;
};

export const DefaultStory = Template.bind({});

export const ConnectedStory = Template.bind({});
ConnectedStory.args = {
  isConnected: true,
};
