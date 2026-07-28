import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ModalOverlay } from './modal-overlay';

export default {
  title: 'Components/ComponentLibrary/ModalOverlay (deprecated)',
  component: ModalOverlay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the ModalOverlay from @metamask/design-system-react instead.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
} as Meta<typeof ModalOverlay>;

const Template: StoryFn<typeof ModalOverlay> = (args) => (
  <ModalOverlay {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
