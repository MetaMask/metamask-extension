import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { ListItem } from './list-item';

export default {
  title: 'Components/ComponentLibrary/ListItem',
  component: ListItem,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: { children: 'List item' },
} as Meta<typeof ListItem>;

const ListItemStory: StoryFn<typeof ListItem> = (args) => {
  return <ListItem {...args} />;
};

export const DefaultStory = ListItemStory.bind({});
DefaultStory.storyName = 'Default';

export const Children = ListItemStory.bind({});
Children.args = {
  children: 'ListItem children',
};

export const IsDisabled = ListItemStory.bind({});
IsDisabled.args = {
  isDisabled: true,
};
IsDisabled.storyName = 'isDisabled';

export const As: StoryFn<typeof ListItem> = (args) => {
  return (
    <>
      <ListItem {...args}>As: div</ListItem>
      <ListItem as="button" {...args}>
        As: button
      </ListItem>
      <ListItem as="a" {...args}>
        As: anchor
      </ListItem>
    </>
  );
};
