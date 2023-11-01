import React from 'react';
import Footer from '.';

export default {
  title: 'Components/App/Confirmation/Footer',
  description: 'Generic footer component for confirmation pages',
  component: Footer,
  parameters: {
    controls: { sort: 'alpha' },
  },
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

export const DefaultStory = (args) => <Footer {...args} />;

DefaultStory.storyName = 'Default';
