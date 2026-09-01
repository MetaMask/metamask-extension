import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { ModalHeader } from './modal-header';

export default {
  title: 'Components/ComponentLibrary/ModalHeader (deprecated)',
  component: ModalHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [ModalHeader from @metamask/design-system-react](https://metamask.github.io/metamask-design-system/?path=/docs/components-modalheader--docs) instead.',
      },
    },
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    onBack: { action: 'onBack' },
    onClose: { action: 'onClose' },
  },
  args: {
    children: 'ModalHeader',
  },
} as Meta<typeof ModalHeader>;

const Template: StoryFn<typeof ModalHeader> = (args) => {
  return <ModalHeader {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
