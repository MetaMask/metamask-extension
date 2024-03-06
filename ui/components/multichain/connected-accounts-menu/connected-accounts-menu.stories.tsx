import React from 'react';
import { ConnectedAccountsMenu } from './connected-accounts-menu';

export default {
  title: 'Components/Multichain/ConnectedAccountsMenu',
  component: ConnectedAccountsMenu,
  argTypes: {
    anchorElement: {
      control: 'object',
    },
    onClose: {
      action: 'onClose',
    },
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    anchorElement: null,
    isOpen: true,
  },
};

export const DefaultStory = (args) => <ConnectedAccountsMenu {...args} />;
DefaultStory.storyName = 'Default';
