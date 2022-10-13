import React, { useState } from 'react';

import {
  SIZES,
  COLORS,
  BORDER_RADIUS,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';

import { TEXT_FIELD_SIZES, TEXT_FIELD_TYPES } from './text-field.constants';
import { TextField } from './text-field';

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
  title: 'Components/ComponentLibrary/TextField',
  id: __filename,
  component: TextField,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    showClear: {
      control: 'boolean',
    },
    value: {
      control: 'text',
    },
    onChange: {
      action: 'onChange',
      table: { category: 'text field base props' },
    },
    onClear: {
      action: 'onClear',
    },
    clearButtonIconProps: {
      control: 'object',
    },
    clearButtonProps: {
      control: 'object',
    },
    autoComplete: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    autoFocus: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    className: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    disabled: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    error: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    id: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    inputProps: {
      control: 'object',
      table: { category: 'text field base props' },
    },
    leftAccessory: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    maxLength: {
      control: 'number',
      table: { category: 'text field base props' },
    },
    name: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    onBlur: {
      action: 'onBlur',
      table: { category: 'text field base props' },
    },
    onClick: {
      action: 'onClick',
      table: { category: 'text field base props' },
    },
    onFocus: {
      action: 'onFocus',
      table: { category: 'text field base props' },
    },
    onKeyDown: {
      action: 'onKeyDown',
      table: { category: 'text field base props' },
    },
    onKeyUp: {
      action: 'onKeyUp',
      table: { category: 'text field base props' },
    },
    placeholder: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    readOnly: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    required: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    rightAccessory: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    size: {
      control: 'select',
      options: Object.values(TEXT_FIELD_SIZES),
      table: { category: 'text field base props' },
    },
    type: {
      control: 'select',
      options: Object.values(TEXT_FIELD_TYPES),
      table: { category: 'text field base props' },
    },
    truncate: {
      control: 'boolean',
      table: { category: 'text field base props' },
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
    showClear: false,
    placeholder: 'Placeholder...',
    autoFocus: false,
    disabled: false,
    error: false,
    id: '',
    readOnly: false,
    required: false,
    size: SIZES.MD,
    type: 'text',
    truncate: false,
  },
};

const Template = (args) => <TextField {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const ShowClear = (args) => {
  const [value, setValue] = useState('show clear');
  const handleOnChange = (e) => {
    setValue(e.target.value);
  };
  return (
    <TextField
      {...args}
      placeholder="Enter text to show clear"
      value={value}
      onChange={handleOnChange}
      showClear
    />
  );
};

export const OnClear = (args) => {
  const [value, setValue] = useState('onClear example');
  const [showOnClearMessage, setShowOnClearMessage] = useState(false);
  const handleOnChange = (e) => {
    setValue(e.target.value);
    showOnClearMessage && setShowOnClearMessage(false);
  };
  const handleOnClear = () => {
    setShowOnClearMessage(true);
  };
  return (
    <>
      <TextField
        {...args}
        placeholder="Clear text to show onClear message"
        value={value}
        onChange={handleOnChange}
        onClear={handleOnClear}
        showClear
      />
      {showOnClearMessage && <Text marginTop={4}>onClear called</Text>}
    </>
  );
};

export const ClearButtonPropsClearButtonIconProps = Template.bind({});
ClearButtonPropsClearButtonIconProps.args = {
  value: 'clear button props',
  size: SIZES.LG,
  showClear: true,
  clearButtonProps: {
    backgroundColor: COLORS.BACKGROUND_ALTERNATIVE,
    borderRadius: BORDER_RADIUS.XS,
  },
  clearButtonIconProps: {
    size: SIZES.MD,
  },
};
