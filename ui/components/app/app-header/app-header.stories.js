import React from 'react';
import AppHeader from '.';

export default {
  title: 'Components/App/AppHeader',
  id: __filename,
  argTypes: {
    hideNetworkIndicator: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    disableNetworkIndicator: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
    },
  },
};

export const DefaultStory = (args) => <AppHeader {...args} />;

DefaultStory.storyName = 'Default';
