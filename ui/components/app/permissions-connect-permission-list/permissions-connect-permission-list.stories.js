import React from 'react';

import PermissionsConnectList from './permissions-connect-permission-list';

export default {
  title: 'Components/App/PermissionsConnectList',

  component: PermissionsConnectList,
  argTypes: {
    permissions: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => <PermissionsConnectList {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  permissions: {
    eth_accounts: {},
  },
};
