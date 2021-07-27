import React from 'react';
import { action } from '@storybook/addon-actions';
import NewAccountCreateForm from './new-account.component';

export default {
  title: 'New Account',
};

export const NewAccountComponent = () => {
  return <NewAccountCreateForm createAccount={action('Account Created')} />;
};
