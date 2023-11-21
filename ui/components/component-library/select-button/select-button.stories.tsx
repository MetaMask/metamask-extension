import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SelectWrapper } from '../select-wrapper';
import { Box } from '../box';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
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
    children: 'Select Button',
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
    <Box display={Display.Flex} gap={3}>
      <SelectWrapper
        triggerComponent={
          <SelectButton size={SelectButtonSize.Sm} isBlock {...args}>
            {SelectButtonSize.Sm}
          </SelectButton>
        }
      >
        Small Demo
      </SelectWrapper>
      <SelectWrapper
        triggerComponent={
          <SelectButton size={SelectButtonSize.Md} {...args}>
            {SelectButtonSize.Md}
          </SelectButton>
        }
      >
        Medium Demo
      </SelectWrapper>
      <SelectWrapper
        triggerComponent={
          <SelectButton size={SelectButtonSize.Lg} {...args}>
            {SelectButtonSize.Lg}
          </SelectButton>
        }
      >
        Large Demo
      </SelectWrapper>
    </Box>
  );
};
Size.args = {};
