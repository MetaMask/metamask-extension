import React from 'react';
import {ConnectedSitePopover} from './connected-site-popover';

export default {
  title: 'Components/Multichain/ConnectedSitePopover',
  component: ConnectedSitePopover,
  argTypes: {
    onRemove: {
      action: 'onRemove',
    },
    onViewOnOpensea: {
      action: 'onViewOnOpensea',
    },
  },
};

export const DefaultStory = (args) => <ConnectedSitePopover {...args} />;

DefaultStory.storyName = 'Default';
