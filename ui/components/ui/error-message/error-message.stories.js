import React from 'react';
import ErrorMessage from '.';

export default {
  title: 'Components/UI/ErrorMessage(deprecated)',
  component: ErrorMessage,
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
