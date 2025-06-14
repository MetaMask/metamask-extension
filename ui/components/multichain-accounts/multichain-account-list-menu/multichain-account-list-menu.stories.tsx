import React from 'react';
import { MultichainAccountListMenu } from './index';
import { MultichainAccountListMenuProps } from './multichain-account-list-menu';

export default {
  title: 'Components/Multichain/MultichainAccounts/MultichainAccountListMenu',
  component: MultichainAccountListMenu,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args: MultichainAccountListMenuProps) => (
  <MultichainAccountListMenu {...args} />
);
