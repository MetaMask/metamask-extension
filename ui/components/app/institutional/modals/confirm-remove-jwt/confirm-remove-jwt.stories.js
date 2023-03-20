import React from 'react';
import ConfirmRemoveJWT from '.';

export default {
  title: 'Components/App/Institutional/Modals/ConfirmRemoveJWT',
  component: ConfirmRemoveJWT,
  args: {
    hideModal: () => {
      /**/
    },
    removeAccount: () => {
      /**/
    },
    token: 'jwt',
    custodyAccountDetails: [
      {
        address: '0xAddrEss',
        name: 'name',
        labels: [],
        authDetails: { token: 'jwt' },
      },
    ],
    accounts: [{ address: '0xaddress', balance: '0x0' }],
  },
};

export const DefaultStory = (args) => <ConfirmRemoveJWT {...args} />;

DefaultStory.storyName = 'ConfirmRemoveJWT';
