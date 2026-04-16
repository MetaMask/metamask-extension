import React from 'react';
import { AccountMenu } from '.';

export default {
  title: 'Components/Multichain/AccountMenu',
  component: AccountMenu,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <AccountMenu {...args} />;
