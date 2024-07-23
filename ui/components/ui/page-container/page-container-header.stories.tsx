import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageContainerHeader from './page-container-header';

const meta: Meta<typeof PageContainerHeader> = {
  title: 'UI/PageContainerHeader',
  component: PageContainerHeader,
  argTypes: {
    // Define args types here if any
  },
  args: {
    // Define default args here if any
  },
};

export default meta;
type Story = StoryObj<typeof PageContainerHeader>;

export const Default: Story = {
  // Add any additional properties if required
};
