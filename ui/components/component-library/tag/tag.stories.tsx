import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Tag } from './tag';

export default {
  title: 'Components/ComponentLibrary/Tag (deprecated)',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [`Tag` from `@metamask/design-system-react`](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-tag--docs) instead.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    startIconName: {
      control: 'text',
    },
  },
  args: {
    label: 'Imported',
  },
} as Meta<typeof Tag>;

const Template: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
