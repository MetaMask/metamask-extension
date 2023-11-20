import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
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

export const DefaultStory: StoryFn<typeof SRPQuiz> = () => {
  const [{ isShowingModal }, updateArgs] = useArgs();

  return (
    <>
      <Button onClick={() => updateArgs({ isShowingModal: true })}>
        Open modal
      </Button>
      {isShowingModal && (
        <SRPQuiz
          isOpen={isShowingModal}
          onClose={() => updateArgs({ isShowingModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
