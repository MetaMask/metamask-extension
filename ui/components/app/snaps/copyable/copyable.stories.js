import React from 'react';
import { Copyable } from './copyable';

export default {
  title: 'Components/App/Snaps/Copyable',

  component: Copyable,
  argTypes: {
    text: {
      control: 'text',
    },
  },
  args: {
    text: '',
  },
};

export const DefaultStory = (args) => <Copyable {...args} />;

DefaultStory.storyName = 'Default';
