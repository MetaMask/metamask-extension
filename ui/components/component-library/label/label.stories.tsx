import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Label } from './label';

export default {
  title: 'Components/ComponentLibrary/Label (deprecated)',

  component: Label,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [Label from @metamask/design-system-react] instead.',
      },
    },
  },
  argTypes: {
    htmlFor: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Label',
  },
} satisfies Meta<typeof Label>;

export const DefaultStory: StoryObj<typeof Label> = {
  render: (args) => <Label {...args} />,
  name: 'Default',
};

