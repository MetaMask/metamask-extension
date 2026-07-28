import type { Meta, StoryObj } from '@storybook/react';
import { SensitiveText } from './sensitive-text';
import { SensitiveTextLength } from './sensitive-text.types';

const meta: Meta<typeof SensitiveText> = {
  title: 'Components/ComponentLibrary/SensitiveText (deprecated)',
  component: SensitiveText,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [SensitiveText from @metamask/design-system-react] instead.',
      },
    },
  },
  args: {
    children: 'Sensitive information',
    isHidden: false,
    length: SensitiveTextLength.Short,
  },
} as Meta<typeof SensitiveText>;

export default meta;
type Story = StoryObj<typeof SensitiveText>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
