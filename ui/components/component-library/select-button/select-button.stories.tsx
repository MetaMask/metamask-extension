import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarAccount,
  AvatarAccountSize,
  Box,
  SelectWrapper,
  SelectOption,
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
        label={SelectButtonSize.Sm}
        startAccessory={<AvatarBase size={AvatarBaseSize.Xs} />}
        endAccessory={<AvatarBase size={AvatarBaseSize.Xs} />}
      />
      <SelectButton
        {...args}
        size={SelectButtonSize.Md}
        label={SelectButtonSize.Md}
      />
      <SelectButton
        {...args}
        size={SelectButtonSize.Lg}
        label={SelectButtonSize.Lg}
      />
    </Box>
  );
};

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

export const IsDisabled = Template.bind({});
IsDisabled.args = {
  isDisabled: true,
};
IsDisabled.storyName = 'isDisabled';

export const Label = Template.bind({});
Label.args = {
  label: 'This is the label',
  description: '',
  endAccessory: '',
};

export const Description = Template.bind({});
Description.args = {
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
    <Text variant={TextVariant.bodySm} color={TextColor.warningDefault}>
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

export const Value = Template.bind({});
Value.args = {
  value: {
    startAccessory: (
      <AvatarAccount
        address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
        size={AvatarAccountSize.Sm}
      />
    ),
    label: 'Option 1',
    description: 'Option 1 using prop shape recommendation',
  },
  endAccessory: '',
};

export const DefaultValue = Template.bind({});
DefaultValue.args = {
  defaultValue: {
    startAccessory: (
      <AvatarAccount
        address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
        size={AvatarAccountSize.Sm}
      />
    ),
    label: 'Option 1',
    description: 'Option 1 using prop shape recommendation',
  },
  endAccessory: '',
};

export const SelectWrapperDemo: StoryFn<typeof SelectButton> = (args) => {
  return (
    <SelectWrapper
      placeholder={{
        label: 'Please select an option',
        description:
          'This demo is using SelectWrapper and utilizing the prop shape recommendation',
      }}
      triggerComponent={<SelectButton {...args} />}
    >
      <SelectOption
        value={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
            />
          ),
          label: 'Option 1',
          description: 'You have selected option 1',
        }}
      >
        Option 1
      </SelectOption>
      <SelectOption
        value={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
            />
          ),
          label: 'Option 2',
          description: 'You have selected option 2',
        }}
      >
        Option 2
      </SelectOption>
      <SelectOption
        value={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
            />
          ),
          label: 'Option 3',
          description: 'You have selected option 3',
        }}
      >
        Option 3
      </SelectOption>
    </SelectWrapper>
  );
};

SelectWrapperDemo.args = {
  startAccessory: '',
  endAccessory: '',
};

SelectWrapperDemo.storyName = 'Using SelectWrapper';
