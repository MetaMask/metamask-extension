import React, { useRef } from 'react';
import { Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

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

export default {
  title: 'Components/ComponentLibrary/Input',
  component: Input,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    autoComplete: {
      control: 'boolean',
    },
    autoFocus: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    defaultValue: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    disableStateStyles: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    id: {
      control: 'text',
    },
    maxLength: {
      control: 'number',
    },
    name: {
      control: 'text',
    },
    onBlur: {
      action: 'onBlur',
    },
    onChange: {
      action: 'onChange',
    },
    onFocus: {
      action: 'onFocus',
    },
    placeholder: {
      control: 'text',
    },
    readOnly: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    type: {
      control: 'select',
      options: Object.values(InputType),
    },
    value: {
      control: 'text',
    },
    textVariant: {
      control: 'select',
      options: Object.values(TextVariant),
    },
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
} as Meta<typeof Input>;

const Template = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return <Input {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Type = (args) => (
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
);

Type.args = {
  value: undefined,
};

export const Ref = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const inputRef = useRef<HTMLInputElement>(null);
  const handleOnClick = () => {
    inputRef.current?.focus();
  };
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return (
    <Box display={Display.Flex}>
      <Input {...args} ref={inputRef} value={value} onChange={handleOnChange} />
      <Button
        variant={ButtonVariant.Primary}
        marginLeft={1}
        onClick={handleOnClick}
      >
        Edit
      </Button>
    </Box>
  );
};

export const AutoComplete = Template.bind({});
AutoComplete.args = {
  autoComplete: true,
  type: InputType.Password,
  placeholder: 'Enter password',
};

export const AutoFocus = Template.bind({});
AutoFocus.args = { autoFocus: true };

export const DefaultValue = () => (
  <Input placeholder="Default value" defaultValue="Default value" />
);
export const Disabled = Template.bind({});
Disabled.args = { disabled: true };

export const ErrorStory = Template.bind({});
ErrorStory.args = { error: true };
ErrorStory.storyName = 'Error';

export const MaxLength = Template.bind({});
MaxLength.args = { maxLength: 10, placeholder: 'Max length 10' };

export const ReadOnly = Template.bind({});
ReadOnly.args = { readOnly: true, value: 'Read only' };

export const RequiredStory = Template.bind({});
RequiredStory.args = { required: true, placeholder: 'Required' };
RequiredStory.storyName = 'Required';

export const DisableStateStyles = Template.bind({});
DisableStateStyles.args = {
  disableStateStyles: true,
};

export const TextVariantStory = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return (
    <Box
      display={Display.InlineFlex}
      flexDirection={FlexDirection.Column}
      gap={4}
    >
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.displayMd}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.headingLg}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.headingMd}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.headingSm}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.bodyLgMedium}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.bodyMdBold}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.bodyMd}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.bodySm}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.bodySmBold}
      />
      <Input
        {...args}
        value={value}
        onChange={handleOnChange}
        textVariant={TextVariant.bodyXs}
      />
    </Box>
  );
};

TextVariantStory.storyName = 'Text Variant';
