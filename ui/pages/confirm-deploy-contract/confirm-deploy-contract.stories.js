/* eslint-disable react/prop-types */
import React from 'react';
import ConfirmDeployContract from '.';

export default {
  title: 'Pages/ConfirmDeployContract',
  id: __filename,
  component: ConfirmDeployContract,
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
    txData: {
      control: {
        type: 'object',
      },
    },
  },
};

export const DefaultStory = (args) => {
  return <ConfirmDeployContract {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  receiver: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
  sender: 'Sender',
};
