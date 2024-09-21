import React from 'react';
import ConnectedAccountsPermissions from './connected-accounts-permissions';

export default {
  title: 'Components/App/ConnectedAccountsPermissions',
  component: ConnectedAccountsPermissions,
  argTypes: {
    permission: {
      control: 'array',
    },
  },
  args: {
    permissions: [
      { key: 'permission1' },
      { key: 'permission2' },
      { key: 'permission3' },
    ],
  },
};

export const DefaultStory = (args) => (
  <ConnectedAccountsPermissions {...args} />
);

DefaultStory.storyName = 'Default';
