import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PageContainerHeader from './page-container-header';

const meta: Meta<typeof PageContainerHeader> = {
  title: 'Components/UI/PageContainer/PageContainerHeader',
  component: PageContainerHeader,
  argTypes: {
    // Define args types here if any
    children: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    // Define default args here if any
    children: 'Page Container Header',
  },
};

export default meta;
type Story = StoryObj<typeof PageContainerHeader>;

export const Default: Story = {
  // Add any additional properties if required
  args: {
    title: 'Components/UI/PageContainer/PageContainerHeader',
    subtitle: 'Sample Subtitle',
    showBackButton: true,
    backButtonString: 'Back',
    tabs: <div>Sample Tabs</div>,
    headerCloseText: 'Close',
    hideClose: false,
  },
};
