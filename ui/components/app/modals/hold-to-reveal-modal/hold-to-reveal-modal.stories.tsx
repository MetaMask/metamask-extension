import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
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

export const DefaultStory: StoryFn<typeof HoldToRevealModal> = (args) => (
  <HoldToRevealModal {...args} />
);

DefaultStory.storyName = 'Default';
