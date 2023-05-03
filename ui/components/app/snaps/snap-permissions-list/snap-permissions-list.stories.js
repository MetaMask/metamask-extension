import React from 'react';

import SnapPermissionsList from '.';

export default {
  title: 'Components/App/Snaps/SnapPermissionsList',

  component: SnapPermissionsList,
  argTypes: {
    permissions: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => <SnapPermissionsList {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  permissions: {
    eth_accounts: {},
    snap_dialog: {},
    snap_getBip32PublicKey: {
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
};
