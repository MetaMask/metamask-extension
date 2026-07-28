import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/ComponentLibrary/Skeleton (deprecated)',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the Skeleton component from @metamask/design-system-react instead.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
  },
  args: {
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const DefaultStory: Story = {
  args: {
    height: 32,
    width: 300,
  },
};

DefaultStory.storyName = 'Default';
