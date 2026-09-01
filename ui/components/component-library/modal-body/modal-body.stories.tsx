import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ModalBody } from './modal-body';

const meta: Meta<typeof ModalBody> = {
  title: 'Components/ComponentLibrary/ModalBody (deprecated)',
  component: ModalBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use `ModalBody` from `@metamask/design-system-react` instead.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
  args: {
    className: '',
    children: 'Modal Body',
  },
};

export default meta;
type Story = StoryObj<typeof ModalBody>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';
