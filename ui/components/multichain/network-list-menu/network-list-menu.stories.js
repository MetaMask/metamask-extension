import React from 'react';
import { NetworkListMenu } from '.';

export default {
  title: 'Components/Multichain/NetworkListMenu',
  component: NetworkListMenu,
  argTypes: {
    closeMenu: {
      action: 'closeMenu',
    },
  },
};

export const DefaultStory = (args) => <NetworkListMenu {...args} />;
