import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Preloader from './preloader-icon.component';

const meta: Meta<typeof Preloader> = {
  title: 'Components/ComponentLibrary/Preloader',
  component: Preloader,
  argTypes: {
    className: {
      control: 'text',
    },
    size: {
      control: 'number',
    },
  },
  args: {
    className: '',
    size: 16,
  },
};

export default meta;
type Story = StoryObj<typeof Preloader>;

export const DefaultStory: Story = {
  render: (args) => <Preloader {...args} />,
};

DefaultStory.storyName = 'Default';
