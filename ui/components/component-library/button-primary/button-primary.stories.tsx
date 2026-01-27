import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ButtonPrimary } from './button-primary';
import { ButtonPrimarySize } from './button-primary.types';

export default {
  tags: ['autodocs'],
  title: 'Components/ComponentLibrary/ButtonPrimary (deprecated)',
  component: ButtonPrimary,
  parameters: {
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },

    size: {
      control: 'select',
      options: Object.values(ButtonPrimarySize),
    },
  },
  args: {
    children: 'Button Primary',
  },
} as Meta<typeof ButtonPrimary>;

export const DefaultStory: StoryFn<typeof ButtonPrimary> = (args) => (
  <ButtonPrimary {...args} />
);

DefaultStory.storyName = 'Default';
