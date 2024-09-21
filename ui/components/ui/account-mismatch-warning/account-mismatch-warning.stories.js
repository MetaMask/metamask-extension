import React from 'react';
import AccountMismatchWarning from './account-mismatch-warning.component';

export default {
  title: 'Components/UI/AccountMismatchWarning',
  component: AccountMismatchWarning,
  argTypes: {
    address: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <AccountMismatchWarning {...args} />;

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};
