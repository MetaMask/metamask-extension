import React from 'react';

import PermissionsConnectList from '.';

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
