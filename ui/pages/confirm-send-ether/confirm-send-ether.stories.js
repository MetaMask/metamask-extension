import React from 'react';
import { store } from '../../../.storybook/preview';
import ConfirmSendEther from '.';

const options = [];
const state = store.getState();
const { identities } = state.metamask;
Object.keys(identities).forEach(function (key) {
  options.push({
    label: identities[key].name,
    address: key,
  });
});
export default {
  title: 'Pages/ConfirmSendEther',
  id: __filename,
  component: ConfirmSendEther,
  argTypes: {
    receiver: {
      control: {
        type: 'select',
      },
      options: ['Receiver', '0xaD6D458402F60fD3Bd25163575031ACDce07538D'],
    },
    sender: {
      control: {
        type: 'select',
      },
      options: ['Sender'],
    },
  },
};
export const DefaultStory = (args) => {
  return <ConfirmSendEther {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  receiver: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
  sender: 'Sender',
};
