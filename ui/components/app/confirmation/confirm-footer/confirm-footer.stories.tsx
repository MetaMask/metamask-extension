import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import ConfirmFooter from '.';

export default {
  title: 'Components/App/Confirmation/ConfirmFooter',
  description: 'Generic footer component for confirmation pages',
  component: ConfirmFooter,
  parameters: {
    controls: { sort: 'alpha' },
  },
  argTypes: {
    cancelText: {
      control: 'text',
    },
    confirmText: {
      control: 'text',
    },
    onCancel: {
      action: 'onCancel',
    },
    onConfirm: {
      action: 'onConfirm',
    },
    cancelButtonProps: {
      control: 'object',
    },
    confirmButtonProps: {
      control: 'object',
    },
  },
  args: {
    cancelText: 'Cancel',
    confirmText: 'Confirm',
  },
} as Meta<typeof ConfirmFooter>;

const Template: StoryFn<typeof ConfirmFooter> = (args) => (
  <ConfirmFooter {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
