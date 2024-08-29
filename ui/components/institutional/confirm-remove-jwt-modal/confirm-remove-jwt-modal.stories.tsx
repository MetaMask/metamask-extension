import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
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
} as Meta<typeof ConfirmRemoveJWT>;

const Template: StoryFn<typeof ConfirmRemoveJWT> = (args) => (
  <ConfirmRemoveJWT {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'ConfirmRemoveJWT';
