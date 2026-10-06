import React from 'react';
import SelectedAccount from './selected-account.container';

export default {
  title: 'Components/App/SelectedAccount',
  argTypes: {
    copied: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => <SelectedAccount {...args} />;

DefaultStory.storyName = 'Default';
