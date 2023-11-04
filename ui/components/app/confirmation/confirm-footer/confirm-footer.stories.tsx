import type { Meta, StoryObj } from '@storybook/react';

import ConfirmFooter from '.';

const meta: Meta<typeof ConfirmFooter> = {
  title: 'Components/App/Confirmation/ConfirmFooter',
  component: ConfirmFooter,
  argTypes: {
    cancelText: {
      control: 'text',
      description: 'Text for the cancel button',
      default: 'Cancel',
    },
    confirmText: {
      control: 'text',
      description: 'Text for the confirm button',
      default: 'Confirm',
    },
    onCancel: {
      action: 'onCancel',
      description: 'Function to call when the cancel button is clicked',
    },
    onConfirm: {
      action: 'onConfirm',
      description: 'Function to call when the confirm button is clicked',
    },
  },
  args: {
    cancelText: 'Cancel',
    confirmText: 'Confirm',
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmFooter>;

// 👇 Throws a type error it the args don't match the component props
export const DefaultStory: Story = {};
DefaultStory.name = 'Default';
