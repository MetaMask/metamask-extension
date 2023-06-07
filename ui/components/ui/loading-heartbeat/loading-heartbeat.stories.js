import React from 'react';
import LoadingHeartBeat from '.';

export default {
  title: 'Components/UI/LoadingHeartBeat',
  component: LoadingHeartBeat,
  argTypes: {
    backgroundColor: {
      control: 'text',
    },
    estimateUsed: {
      control: 'text',
    },
  },
  args: {
    backgroundColor: 'blue',
    estimateUsed: '',
  },
};

export const DefaultStory = (args) => <LoadingHeartBeat {...args} />;

DefaultStory.storyName = 'Default';
