import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import IconButton from './icon-button';

const meta: Meta<typeof IconButton> = {
  title: 'UI/IconButton',
  component: IconButton,
  parameters: {
    docs: {
      // Assuming there's a README.mdx file in the same directory for documentation
      page: require('./README.mdx'),
    },
  },
  argTypes: {
    onClick: {
      action: 'clicked',
    },
    icon: {
      control: 'text',
      description: 'The icon to display',
    },
    title: {
      control: 'text',
      description: 'The title text for the button',
    },
  },
  args: {
    icon: 'settings',
    title: 'Settings',
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  render: (args) => <IconButton {...args} />,
};
