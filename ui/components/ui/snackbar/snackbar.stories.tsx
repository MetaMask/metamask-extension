import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Snackbar from './snackbar.component';

const meta: Meta<typeof Snackbar> = {
  title: 'Components/UI/Snackbar',
  component: Snackbar,
  argTypes: {
    className: {
      control: 'text',
    },
    content: {
      control: 'text',
    },
  },
  args: {
    className: '',
    content: 'This is a snackbar message',
  },
};

export default meta;
type Story = StoryObj<typeof Snackbar>;

export const DefaultStory: Story = {
  render: (args) => <Snackbar {...args} />,
};

DefaultStory.storyName = 'Default';
