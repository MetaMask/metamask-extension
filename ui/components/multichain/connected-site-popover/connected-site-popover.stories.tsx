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

export const DefaultStory = (args) => <ConnectedSitePopover {...args} />;

DefaultStory.storyName = 'Default';
