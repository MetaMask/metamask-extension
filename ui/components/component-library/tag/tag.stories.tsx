import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Tag } from './tag';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/Tag',
  component: Tag,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
  },
  args: {
    label: 'Imported',
  },
} as Meta<typeof Tag>;

export const DefaultStory: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

DefaultStory.storyName = 'Default';

export const Label: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

Label.args = {
  label: 'Label Story',
};
