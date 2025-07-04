import React from 'react';
import { AccountListMenu } from '.';

export default {
  title: 'Components/Multichain/AccountListMenu',
  component: AccountListMenu,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <AccountListMenu {...args} />;
