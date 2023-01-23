import React from 'react';
import Spinner from '.';

export default {
  title: 'Components/UI/Spinner',

  argTypes: {
    className: {
      control: 'text',
    },
    color: {
      control: 'text',
    },
  },
  args: {
    color: 'var(--color-warning-default)',
  },
};

export const DefaultStory = (args) => (
  <div style={{ width: 100, height: 100 }}>
    <Spinner {...args} />
  </div>
);

DefaultStory.storyName = 'Default';
