import { action } from '@storybook/addon-actions';
import React from 'react';
import Box from '../../components/ui/box/box';
import NewAccountCreateForm from './new-account.component';

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
    <Box className="new-account">
      <NewAccountCreateForm
        {...args}
        createAccount={action('Account Created')}
      />
    </Box>
  );
};

DefaultStory.storyName = 'Default';
