import React from 'react';
import LoadingIndicator from './loading-indicator';

export default {
  title: 'Components/UI/LoadingIndicator',
  component: LoadingIndicator,
  argTypes: {
    isLoading: {
      control: 'boolean',
    },
    alt: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
  args: {
    isLoading: true,
    alt: '',
    title: '',
    children: '',
  },
};

export const DefaultStory = (args) => <LoadingIndicator {...args} />;

DefaultStory.storyName = 'Default';
