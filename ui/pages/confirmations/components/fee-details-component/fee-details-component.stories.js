import React from 'react';
import FeeDetailsComponent from '.';

export default {
  title: 'Confirmations/Components/FeeDetailsComponent',
  argTypes: {
    shouldShow: {
      control: 'boolean',
    },
  },
  args: {
    shouldShow: true,
  },
};

export const DefaultStory = (args) => <FeeDetailsComponent {...args} />;

DefaultStory.storyName = 'Default';
