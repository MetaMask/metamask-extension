import React from 'react';
import UpdateSnapPermissionList from './update-snap-permission-list';

export default {
  title: 'Components/App/Snaps/UpdateSnapPermissionList',
  component: UpdateSnapPermissionList,
  argTypes: {
    approvedPermissions: {
      control: 'object',
    },
    revokedPermissions: {
      control: 'object',
    },
    newPermissions: {
      control: 'object',
    },
    targetSubjectMetadata: {
      control: 'object',
    },
  },
  args: {
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
    targetSubjectMetadata: {
      extensionId: null,
      iconUrl: null,
      name: 'TypeScript Example Snap',
      origin: 'local:http://localhost:8080',
      subjectType: 'snap',
      version: '0.2.2',
    },
  },
};

export const DefaultStory = (args) => <UpdateSnapPermissionList {...args} />;

DefaultStory.storyName = 'Default';
