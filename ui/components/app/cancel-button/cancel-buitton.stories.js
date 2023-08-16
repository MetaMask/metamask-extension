import React from 'react';
import CancelButton from './cancel-button';

export default {
  title: 'Components/App/CancelButton',
  component: CancelButton,
  argTypes: {
    transaction: {
      control: 'object',
    },
    cancelTransaction: {
      control: 'cancelTransaction',
    },
    detailsModal: {
      control: 'boolean',
    },
  },
  args: {
    detailsModal: true,
    transaction: {
      id: '12345',
      status: 'pending',
    },
  },
};

export const DefaultStory = (args) => <CancelButton {...args} />;

DefaultStory.storyName = 'Default';
