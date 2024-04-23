import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Button } from '../../../component-library';
import SRPQuiz from '.';

export default {
  title: 'Components/App/SRPQuizModal',
  component: SRPQuiz,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
    },
  },
} as Meta<typeof SRPQuiz>;

export const DefaultStory: StoryFn<typeof SRPQuiz> = (args) => (
  <SRPQuiz {...args} />
);

DefaultStory.storyName = 'Default';
