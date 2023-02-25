import React from 'react';
import BottomButtons from './bottom-buttons';

export default {
  title: 'Pages/CreateAccount/ImportAccount/BottomButtons',
  argTypes: {
    importAccountFunc: {
      control: {
        type: 'function',
      },
    },
    isPrimaryDisabled: {
      control: {
        type: 'boolean',
      },
    },
  },
};

export const DefaultStory = (args) => <BottomButtons {...args} />;

DefaultStory.storyName = 'Default';
