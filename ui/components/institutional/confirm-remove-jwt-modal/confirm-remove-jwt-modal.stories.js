import React from 'react';
import ConfirmRemoveJWT from '.';

export default {
  title: 'Components/Institutional/ConfirmRemoveJWT',
  component: ConfirmRemoveJWT,
  args: {
    hideModal: () => {
      /**/
    },
    removeAccount: () => {
      /**/
    },
    token: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    custodyAccountDetails: [
      {
        address: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
        name: 'Test name account',
        labels: [],
        authDetails: { token: '0xaD6D458402F60fD3Bd25163575031ACDce07538D' },
      },
    ],
    accounts: [
      { address: '0xaD6D458402F60fD3Bd25163575031ACDce07538D', balance: '0x0' },
    ],
  },
};

export const DefaultStory = (args) => <ConfirmRemoveJWT {...args} />;

DefaultStory.storyName = 'ConfirmRemoveJWT';
