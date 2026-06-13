import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ModalHeader } from './modal-header';

const meta: Meta<typeof ModalHeader> = {
  title: 'Components/ComponentLibrary/ModalHeader/Deprecated',
  component: ModalHeader,
};

export default meta;
type Story = StoryObj<typeof ModalHeader>;

export const DefaultStory: Story = {
  args: {
    children: 'Modal Title',
    onBack: () => undefined,
    onClose: () => undefined,
  },
};

DefaultStory.storyName = 'Default';
