import React from 'react';
import ConfirmSendEther from '.';

export default {
  title: 'Pages/ConfirmSendEther',
  id: __filename,
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
