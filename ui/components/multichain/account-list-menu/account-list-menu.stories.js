import React from 'react';
import { AccountListMenu } from './account-list-menu';

export default {
  title: 'Components/Multichain/AccountListMenu',
  component: AccountListMenu,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  }
};

export const DefaultStory = (args) => <AccountListMenu {...args} />;
