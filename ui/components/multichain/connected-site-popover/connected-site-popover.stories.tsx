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
    networkName: 'Avalanche',
  },
};

export const DefaultStory = {};

export const ConnectedStory = {
  args: {
    isConnected: true,
  },
};
