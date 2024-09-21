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
    backgroundColor: 'var(--color-background-default)',
    estimateUsed: 'low',
  },
};

export const DefaultStory = (args) => (
  <div>
    <LoadingHeartBeat {...args} />
    Text underneath LoadingHeartBeat
  </div>
);

DefaultStory.storyName = 'Default';
