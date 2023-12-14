import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { List } from './list';

export default {
  title: 'Components/ComponentLibrary/List',
  component: List,
  parameters: {
    docs: {
      page: README,
    },
  },
} as Meta<typeof List>;

const ListStory: StoryFn<typeof List> = (args) => {
  return (
    <List {...args}>
      <li>Item 1</li>
      <li>Item 2</li>
    </List>
  );
};

export const DefaultStory = ListStory.bind({});
DefaultStory.storyName = 'Default';

export const As: StoryFn<typeof List> = (args) => {
  return (
    <>
      <List marginBottom={4} {...args}>
        <li>ul item 1</li>
        <li>ul item 2</li>
      </List>
      <List as="ol" {...args}>
        <li>ol item 1</li>
        <li>ol item 2</li>
      </List>
    </>
  );
};

export const Children = ListStory.bind({});
Children.storyName = 'Default';
