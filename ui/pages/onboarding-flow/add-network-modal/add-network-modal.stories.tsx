import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AddNetworkModal from './index';

const meta: Meta<typeof AddNetworkModal> = {
  title: 'Components/OnboardingFlow/AddNetworkModal',
  component: AddNetworkModal,
  argTypes: {
    // Define the argTypes for the component props if needed
  },
  args: {
    // Define the default args for the component props if needed
  },
};

export default meta;
type Story = StoryObj<typeof AddNetworkModal>;

export const DefaultStory: Story = {
  args: {
    // Define the default args for the default story if needed
  },
};
