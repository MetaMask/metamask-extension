import React from 'react';
import ErrorPage from '.';

export default {
  title: 'Pages/Error',
  id: __filename,
  argTypes: {
    error: {
      control: 'object',
    },
  },
  args: {
    error: {
      message: 'message',
      code: 'code',
      name: 'name',
      stack: 'stack',
    },
  },
};

export const DefaultStory = (args) => <ErrorPage {...args} />;

DefaultStory.storyName = 'Default';
