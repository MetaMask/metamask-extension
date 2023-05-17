import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Tag } from './tag';
import { TagProps } from './tag.types';
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
} as ComponentMeta<typeof Tag>;

export const DefaultStory = (args: TagProps) => <Tag {...args} />;

DefaultStory.storyName = 'Default';

export const Label = (args: TagProps) => <Tag {...args}>Anchor Element</Tag>;

Label.args = {
  label: 'Label Story',
};
