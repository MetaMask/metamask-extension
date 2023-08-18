import React from 'react';
import CustomNonce from '.';

export default {
  title: 'Components/App/CustomNonce',
  argTypes: {
    nextNonce: {
      control: 'number',
    },
    customNonceValue: {
      control: 'text',
    },
    showCustomizeNonceModal: {
      action: 'showCustomizeNonceModal',
    },
  },
};

export const DefaultStory = (args) => <CustomNonce {...args} />;

DefaultStory.storyName = 'Default';
