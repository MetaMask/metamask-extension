import React, { useRef } from 'react';
import { Meta, StoryObj } from '@storybook/react';

import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { Button, Box, ButtonVariant } from '..';

import { InputType } from './input.types';
import { Input } from './input';

import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

const meta: Meta<typeof Input> = {
  title: 'Components/ComponentLibrary/Input',
  component: Input,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    autoComplete: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
    className: { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    disableStateStyles: { control: 'boolean' },
    error: { control: 'boolean' },
    id: { control: 'text' },
    maxLength: { control: 'number' },
    name: { control: 'text' },
    onBlur: { action: 'onBlur' },
    onChange: { action: 'onChange' },
    onFocus: { action: 'onFocus' },
    placeholder: { control: 'text' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    type: { control: 'select', options: Object.values(InputType) },
    value: { control: 'text' },
    textVariant: { control: 'select', options: Object.values(TextVariant) },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    placeholder: 'Placeholder...',
    value: '',
  },
};

export default meta;

export const DefaultStory: StoryObj<typeof Input> = {
  render: (args) => <Input {...args} />,
};

export const Type: StoryObj<typeof Input> = {
  render: (args) => (
    <Box
      display={Display.InlineFlex}
      flexDirection={FlexDirection.Column}
      gap={4}
    >
      <Input {...args} placeholder="Default" />
      <Input {...args} type={InputType.Password} placeholder="Password" />
      <Input {...args} type={InputType.Number} placeholder="Number" />
      <Input {...args} type={InputType.Search} placeholder="Search" />
    </Box>
  ),
  args: {
    value: undefined,
  },
};

export const Ref: StoryObj<typeof Input> = {
  render: (args) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleOnClick = () => {
      inputRef.current?.focus();
    };

    return (
      <Box display={Display.Flex}>
        <Input {...args} ref={inputRef} />
        <Button
          variant={ButtonVariant.Primary}
          marginLeft={1}
          onClick={handleOnClick}
        >
          Edit
        </Button>
      </Box>
    );
  },
};

export const AutoComplete: StoryObj<typeof Input> = {
  args: {
    autoComplete: true,
    type: InputType.Password,
    placeholder: 'Enter password',
  },
};

export const AutoFocus: StoryObj<typeof Input> = {
  args: { autoFocus: true },
};

export const DefaultValue: StoryObj<typeof Input> = {
  render: () => (
    <Input placeholder="Default value" defaultValue="Default value" />
  ),
};

export const Disabled: StoryObj<typeof Input> = {
  args: { disabled: true },
};

export const ErrorStory: StoryObj<typeof Input> = {
  args: { error: true },
  storyName: 'Error',
};

export const MaxLength: StoryObj<typeof Input> = {
  args: { maxLength: 10, placeholder: 'Max length 10' },
};

export const ReadOnly: StoryObj<typeof Input> = {
  args: { readOnly: true, value: 'Read only' },
};

export const RequiredStory: StoryObj<typeof Input> = {
  args: { required: true, placeholder: 'Required' },
  storyName: 'Required',
};

export const DisableStateStyles: StoryObj<typeof Input> = {
  args: {
    disableStateStyles: true,
  },
};

export const TextVariantStory: StoryObj<typeof Input> = {
  render: (args) => (
    <Box
      display={Display.InlineFlex}
      flexDirection={FlexDirection.Column}
      gap={4}
    >
      <Input {...args} textVariant={TextVariant.displayMd} />
      <Input {...args} textVariant={TextVariant.headingLg} />
      <Input {...args} textVariant={TextVariant.headingMd} />
      <Input {...args} textVariant={TextVariant.headingSm} />
      <Input {...args} textVariant={TextVariant.bodyLgMedium} />
      <Input {...args} textVariant={TextVariant.bodyMdBold} />
      <Input {...args} textVariant={TextVariant.bodyMd} />
      <Input {...args} textVariant={TextVariant.bodySm} />
      <Input {...args} textVariant={TextVariant.bodySmBold} />
      <Input {...args} textVariant={TextVariant.bodyXs} />
    </Box>
  ),
  storyName: 'Text Variant',
};
