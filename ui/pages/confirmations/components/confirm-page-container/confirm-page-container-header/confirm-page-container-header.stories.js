import React from 'react';
import ConfirmPageContainerHeader from '.';

export default {
  title:
    'Confirmations/Components/ConfirmPageContainer/ConfirmPageContainerHeader',

  argTypes: {
    accountAddress: {
      control: 'text',
    },
    showAccountInHeader: {
      control: 'boolean',
    },
    showEdit: {
      control: 'boolean',
    },
    onEdit: {
      action: 'onEdit',
    },
    children: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <ConfirmPageContainerHeader {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  showEdit: false,
  showAccountInHeader: false,
  accountAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  children: 'children',
};
