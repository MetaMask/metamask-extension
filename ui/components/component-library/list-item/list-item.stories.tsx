import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { ListItem as ListItemComponent } from '.';

export default {
  title: 'Components/ComponentLibrary/ListItem',
  component: ListItemComponent,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: { children: 'List item' },
} as Meta<typeof ListItemComponent>;

const ListItem: StoryFn<typeof ListItemComponent> = (args) => {
  return <ListItemComponent {...args} />;
};

export const DefaultStory = ListItem.bind({});
DefaultStory.storyName = 'Default';

export const Children = ListItem.bind({});
Children.args = {
  children: 'ListItem children',
};

export const IsDisabled = ListItem.bind({});
IsDisabled.args = {
  isDisabled: true,
};
IsDisabled.storyName = 'isDisabled';
