import React from 'react';
import { action } from '@storybook/addon-actions';
import NewAccountCreateForm from './new-account.component';

export default {
  title: 'New Account',
  id: __filename,
};

export const NewAccountComponent = () => {
  return <NewAccountCreateForm createAccount={action('Account Created')} />;
};
