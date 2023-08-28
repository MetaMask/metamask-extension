import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { SelectOption as SelectOptionComponent } from '.';

export default {
  title: 'Components/ComponentLibrary/SelectOption',
  component: SelectOptionComponent,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
} as Meta<typeof SelectOptionComponent>;

const SelectOption: StoryFn<typeof SelectOptionComponent> = (args) => {
  return <SelectOptionComponent {...args} />;
};

export const DefaultStory = SelectOption.bind({});
DefaultStory.storyName = 'Default';

export const Demo = SelectOption.bind({});
Demo.args = {};
