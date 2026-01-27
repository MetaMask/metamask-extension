import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ButtonLink } from './button-link';
import { ButtonLinkSize } from './button-link.types';

export default {
  title: 'Components/ComponentLibrary/ButtonLink (deprecated)',
  component: ButtonLink,
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
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    danger: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(ButtonLinkSize),
    },
  },
  args: {
    children: 'Button Link',
  },
} as Meta<typeof ButtonLink>;

export const DefaultStory: StoryFn<typeof ButtonLink> = (args) => (
  <ButtonLink {...args} />
);

DefaultStory.storyName = 'Default';
