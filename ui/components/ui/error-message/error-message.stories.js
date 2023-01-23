import React from 'react';
import README from './README.mdx';
import ErrorMessage from '.';

export default {
  title: 'Components/UI/ErrorMessage',

  component: ErrorMessage,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    errorMessage: { control: 'text' },
    errorKey: { control: 'text' },
  },
};

export const DefaultStory = (args) => <ErrorMessage {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  errorMessage: 'There was an error!',
};
