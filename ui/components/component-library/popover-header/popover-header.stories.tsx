import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { PopoverHeader } from './popover-header';

export default {
  title: 'Components/ComponentLibrary/PopoverHeader (deprecated)',
  component: PopoverHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [PopoverHeader from @metamask/design-system-react] instead.',
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
    children: 'PopoverHeader',
  },
} as Meta<typeof PopoverHeader>;

const Template: StoryFn<typeof PopoverHeader> = (args) => {
  return <PopoverHeader {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
