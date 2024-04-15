import React from 'react';
import { ThreeStepProgressBar, TwoStepProgressBar } from '.';

export default {
  title: 'Components/App/StepProgressBar',
  argTypes: {
    stage: {
      control: {
        type: 'select',
      },
      options: [1, 2, 3, 4, 5],
    },
    boxProps: {
      control: {
        type: 'object',
      },
    },
  },
};

export const DefaultStory = (args) => <ThreeStepProgressBar {...args} />;
DefaultStory.storyName = 'Default';

export const ThreeStepProgressBarStory = (args) => (
  <ThreeStepProgressBar {...args} />
);
ThreeStepProgressBarStory.storyName = 'ThreeStepProgressBar';

export const TwoStepProgressBarStory = (args) => (
  <TwoStepProgressBar {...args} />
);
TwoStepProgressBarStory.storyName = 'TwoStepProgressBar';
