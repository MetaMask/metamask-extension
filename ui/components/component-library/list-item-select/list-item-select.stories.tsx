import { StoryFn, Meta } from '@storybook/react';
import React, { useState } from 'react';
import README from './README.mdx';

import { ListItemSelect as ListItemSelectComponent } from '.';

export default {
  title: 'Components/ComponentLibrary/ListItemSelect',
  component: ListItemSelectComponent,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: { children: 'List item' },
} as Meta<typeof ListItemSelectComponent>;

const ListItemSelect: StoryFn<typeof ListItemSelectComponent> = (args) => {
  const [isSelected, setIsSelected] = useState(args.isSelected);

  const handleClick = () => {
    setIsSelected(!isSelected);
  };

  return (
    <ListItemSelectComponent
      {...args}
      isSelected={isSelected}
      onClick={handleClick}
    />
  );
};

export const DefaultStory = ListItemSelect.bind({});
DefaultStory.storyName = 'Default';

export const Children = ListItemSelect.bind({});
Children.args = {
  children: 'ListItemSelect children',
};

export const IsDisabled = ListItemSelect.bind({});
IsDisabled.args = {
  isDisabled: true,
};
IsDisabled.storyName = 'isDisabled';

export const IsSelected = ListItemSelect.bind({});
IsSelected.args = {
  isSelected: true,
  as: 'button',
};
IsSelected.storyName = 'isSelected';
