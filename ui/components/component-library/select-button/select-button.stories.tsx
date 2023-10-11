import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SelectWrapper } from '../select-wrapper';
import README from './README.mdx';

import { SelectButtonSize } from './select-button.types';
import { SelectButton } from '.';

export default {
  title: 'Components/ComponentLibrary/SelectButton',
  component: SelectButton,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
  args: {
    children: 'SelectButton',
  },
} as Meta<typeof SelectButton>;

const SelectButtonStory: StoryFn<typeof SelectButton> = (args) => {
  return (
    <SelectWrapper triggerComponent={<SelectButton {...args} />}>
      Demo
    </SelectWrapper>
  );
};

export const DefaultStory = SelectButtonStory.bind({});
DefaultStory.storyName = 'Default';

export const Size: StoryFn<typeof SelectButton> = (args) => {
  return (
    <SelectWrapper
      triggerComponent={
        <SelectButton size={SelectButtonSize.Sm} {...args}>
          {SelectButtonSize.Sm}
        </SelectButton>
      }
    >
      Demo
    </SelectWrapper>
  );
};
Size.args = {};
