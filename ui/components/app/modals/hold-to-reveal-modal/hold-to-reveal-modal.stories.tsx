import { useArgs } from '@storybook/client-api';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { Button } from '../../../component-library';
import HoldToRevealModal from './hold-to-reveal-modal';

export default {
  title: 'Components/App/HoldToRevealModal',
  component: HoldToRevealModal,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
    },
  },
} as Meta<typeof HoldToRevealModal>;

export const DefaultStory: StoryFn<typeof HoldToRevealModal> = () => {
  const [{ isShowingModal }, updateArgs] = useArgs();

  return (
    <>
      <Button onClick={() => updateArgs({ isShowingModal: true })}>
        Open modal
      </Button>
      {isShowingModal && (
        <HoldToRevealModal
          isOpen={isShowingModal}
          onClose={() => updateArgs({ isShowingModal: false })}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
