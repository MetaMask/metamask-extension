import React from 'react';
import README from './README.mdx';
import { Tag } from './tag';

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
};

export const DefaultStory = (args) => <Tag {...args} />;

DefaultStory.storyName = 'Default';

export const Label = (args) => <Tag {...args}>Anchor Element</Tag>;

Label.args = {
  label: 'Label Story',
};
