import React from 'react';
import ConfirmSendEther from '.';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Pages/ConfirmSendEther',

  component: ConfirmSendEther,
  argTypes: {
    editTransaction: {
      action: 'editTransaction',
    },
    history: {
      control: 'object',
    },
    txParams: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => {
  return <ConfirmSendEther {...args} />;
};

DefaultStory.storyName = 'Default';
