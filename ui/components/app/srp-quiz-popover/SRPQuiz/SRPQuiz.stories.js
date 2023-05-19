import { useArgs } from '@storybook/client-api';
import React from 'react';
import { Button } from '../../../component-library';
import SRPQuiz from '.';

export default {
  title: 'Components/App/SRPQuizPopover',
  component: SRPQuiz,
  argTypes: {
    isShowingPopover: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = () => {
  const [{ isShowingPopover }, updateArgs] = useArgs();

  return (
    <>
      <Button onClick={() => updateArgs({ isShowingPopover: true })}>
        Open Popover
      </Button>
      {isShowingPopover && (
        <SRPQuiz onClose={() => updateArgs({ isShowingPopover: false })} />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
