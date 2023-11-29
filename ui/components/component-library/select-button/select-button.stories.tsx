import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import { SelectWrapper } from '../select-wrapper';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarAccount,
  AvatarAccountSize,
  Box,
  Text,
} from '..';
import {
  Display,
  TextColor,
  TextVariant,
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
    startAccessory: <AvatarBase size={AvatarBaseSize.Sm} />,
    label: 'Label',
    description: 'Lorem ipsum Lorem ipsum',
    endAccessory: <AvatarBase size={AvatarBaseSize.Sm} />,
  },
} as Meta<typeof SelectButton>;

const Template: StoryFn<typeof SelectWrapper> = (args) => {
  return <SelectButton {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size: StoryFn<typeof SelectButton> = (args) => {
  return (
    <Box display={Display.Flex} gap={3}>
      <SelectButton
        {...args}
        size={SelectButtonSize.Sm}
        title={SelectButtonSize.Sm}
        startAccessory={<AvatarBase size={AvatarBaseSize.Xs} />}
        endAccessory={<AvatarBase size={AvatarBaseSize.Xs} />}
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

export const Label = Template.bind({});
Label.args = {
  label: 'This is the label',
  description: '',
  endAccessory: '',
};

export const Description = Template.bind({});
Description.args = {
  label: 'This is a label',
  description: 'This is a demo of description',
  endAccessory: '',
};

export const StartAccessory = Template.bind({});
StartAccessory.args = {
  startAccessory: (
    <AvatarAccount
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
      size={AvatarAccountSize.Sm}
    />
  ),
  endAccessory: '',
};

export const EndAccessory = Template.bind({});
EndAccessory.args = {
  endAccessory: (
    <AvatarAccount
      address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
      size={AvatarAccountSize.Sm}
    />
  ),
  startAccessory: '',
};

export const Children = Template.bind({});
Children.args = {
  description: '',
  startAccessory: '',
  endAccessory: '',
  children: (
    <Text variant={TextVariant.bodySm} color={TextColor.sepolia}>
      Children demo text
    </Text>
  ),
};

export const Placeholder: StoryFn<typeof SelectButton> = (args) => {
  return (
    <Box display={Display.Flex} gap={3}>
      <SelectButton {...args} />
      <SelectButton
        {...args}
        placeholder={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
            />
          ),
          label: 'Placeholder label',
          description: 'Placeholder example using prop shape recommendation',
        }}
      />
    </Box>
  );
};

Placeholder.args = {
  label: '',
  description: '',
  startAccessory: '',
  endAccessory: '',
  placeholder: 'Placeholder as simple string',
};

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
// children
// placeholder
// value
// defaultValue
