import type { Meta, StoryObj } from '@storybook/react';
import { ModalFooter } from './modal-footer';

const meta: Meta<typeof ModalFooter> = {
  title: 'Components/ComponentLibrary/ModalFooter (deprecated)',
  component: ModalFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [ModalFooter from @metamask/design-system-react] instead.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalFooter>;

export const DefaultStory: Story = {
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    submitButtonProps: {
      control: 'object',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    cancelButtonProps: {
      control: 'object',
    },
    onCancel: {
      action: 'onCancel',
    },
  },
};

DefaultStory.storyName = 'Default';
