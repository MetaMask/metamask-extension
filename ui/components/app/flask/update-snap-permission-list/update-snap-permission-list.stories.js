import React from 'react';
import UpdateSnapPermissionList from './update-snap-permission-list';

export default {
  title: 'Components/App/UpdateSnapPermissionList',
  component: UpdateSnapPermissionList,

  argTypes: {
    permissions: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => <UpdateSnapPermissionList {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  approvedPermissions: {
    'endowment:network-access': {
      date: 1620710693178,
    },
    snap_getBip32PublicKey: {
      date: 1620710693178,
      caveats: [
        {
          value: [
            {
              path: ['m', `44'`, `0'`],
              curve: 'secp256k1',
            },
          ],
        },
      ],
    },
  },
  revokedPermissions: {
    snap_notify: {
      date: 1620710693178,
    },
    eth_accounts: {
      date: 1620710693178,
    },
  },
  newPermissions: {
    snap_dialog: {
      date: 1620710693178,
    },
  },
};
