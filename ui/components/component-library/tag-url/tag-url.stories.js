import React from 'react';
import README from './README.mdx';
import { TagUrl } from './tag-url';

export default {
  title: 'Components/ComponentLibrary/TagUrl',
  id: __filename,
  component: TagUrl,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    imageSource: {
      control: 'text',
    },
  },
  args: {
    label: 'Imported',
    imageSource: 'https://uniswap.org/favicon.ico',
  },
};

export const DefaultStory = (args) => <TagUrl {...args} />;

DefaultStory.storyName = 'Default';
