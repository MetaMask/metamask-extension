import React from 'react';
import { action } from '@storybook/addon-actions';
import NewAccountCreateForm from './new-account.component';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Pages/CreateAccount/NewAccount',
  argTypes: {
    accounts: {
      control: 'array',
    },
  },
  args: {
    accounts: [],
  },
};
export const DefaultStory = (args) => {
  return (
    <NewAccountCreateForm {...args} createAccount={action('Account Created')} />
  );
};

DefaultStory.storyName = 'Default';
