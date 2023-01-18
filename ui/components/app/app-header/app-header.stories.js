import React from 'react';
import AppHeader from '.';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/App/AppHeader',

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
