import React from 'react';
import AccountOptionsMenu from '.';

export default {
  title: 'Components/App/AccountOptionsMenu',

  argTypes: {
    anchorElement: {
      control: 'func',
    },
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <AccountOptionsMenu {...args} />;

DefaultStory.storyName = 'Default';
