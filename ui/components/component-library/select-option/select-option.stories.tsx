import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SelectButton, SelectWrapper } from '..';
import README from './README.mdx';

import { SelectOption } from '.';

export default {
  title: 'Components/ComponentLibrary/SelectOption',
  component: SelectOption,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
  args: {
    children: 'Option 1',
  },
} as Meta<typeof SelectOption>;

const SelectOptionStory: StoryFn<typeof SelectOption> = (args) => {
  return (
    <SelectWrapper
      triggerComponent={<SelectButton>Select Option</SelectButton>}
    >
      <SelectOption {...args} />
    </SelectWrapper>
  );
};

export const DefaultStory = SelectOptionStory.bind({});
DefaultStory.storyName = 'Default';

export const Demo = SelectOptionStory.bind({});
Demo.args = {};
