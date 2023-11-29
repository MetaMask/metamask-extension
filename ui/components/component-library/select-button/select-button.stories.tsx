import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SelectWrapper } from '../select-wrapper';
import { Box, AvatarBase } from '..';
import { Display } from '../../../helpers/constants/design-system';
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
    startAccessory: <AvatarBase />,
    title: 'Label',
    description: 'Lorem ipsum Lorem ipsum',
    endAccessory: <AvatarBase />,
  },
} as Meta<typeof SelectButton>;

const Template: StoryFn<typeof SelectWrapper> = (args) => {
  return <SelectButton {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  startAccessory: <AvatarBase />,
  title: 'Label',
  description: 'Lorem ipsum Lorem ipsum',
  endAccessory: <AvatarBase />,
};
DefaultStory.storyName = 'Default';

export const Size: StoryFn<typeof SelectButton> = (args) => {
  return (
    <Box display={Display.Flex} gap={3}>
      <SelectButton
        {...args}
        size={SelectButtonSize.Sm}
        title={SelectButtonSize.Sm}
      />
      <SelectButton
        {...args}
        size={SelectButtonSize.Md}
        title={SelectButtonSize.Md}
      />
      <SelectButton
        {...args}
        size={SelectButtonSize.Lg}
        title={SelectButtonSize.Lg}
      />
    </Box>
  );
};
Size.args = {};

export const IsBlock = Template.bind({});
IsBlock.args = {
  isBlock: true,
};
IsBlock.storyName = 'isBlock';

export const IsDanger = Template.bind({});
IsDanger.args = {
  isDanger: true,
};
IsDanger.storyName = 'isDanger';

export const Test: StoryFn<typeof SelectButton> = (args) => {
  return (
    <SelectButton {...args}>
      <Box>
        <Box>one</Box>
        <Box>two</Box>
      </Box>
    </SelectButton>
  );
};
Test.args = {};

// To Do Storybook List:
// title
// description
// startAccessory
// endAccessory
// children
// placeholder
// value
// defaultValue
