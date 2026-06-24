import React from 'react';
import CancelButton from './cancel-button';

export default {
  title: 'Components/App/CancelButton',
  component: CancelButton,
  argTypes: {
    cancelTransaction: {
      control: 'cancelTransaction',
    },
  },
};

export const DefaultStory = (args) => <CancelButton {...args} />;

DefaultStory.storyName = 'Default';
