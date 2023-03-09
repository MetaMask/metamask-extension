import { action } from '@storybook/addon-actions';
import React from 'react';
import NewAccountCreateForm from './new-account.component';

export default {
  title: 'Pages/CreateAccount/NewAccount',
  component: NewAccountCreateForm,
  argTypes: {
    accounts: {
      control: 'array',
    },
  },
  args: {
    accounts: [],
  },
};

export const DefaultStory = (args) => (
  <NewAccountCreateForm {...args} createAccount={action('Account Created')} />
);

DefaultStory.storyName = 'Default';
