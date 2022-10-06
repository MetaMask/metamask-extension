import React, { useState, useRef } from 'react';

import {
  SIZES,
  DISPLAY,
  COLORS,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
  TEXT,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';

import { Icon, ICON_NAMES } from '../icon';
import { BaseAvatar } from '../base-avatar';
import { AvatarToken } from '../avatar-token';
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
    clearIconProps: {
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

export const Size = (args) => {
  return (
    <Box
      display={DISPLAY.INLINE_FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
    >
      <TextField
        {...args}
        placeholder="SIZES.SM (height: 32px)"
        size={SIZES.SM}
      />
      <TextField
        {...args}
        placeholder="SIZES.MD (height: 40px)"
        size={SIZES.MD}
      />
      <TextField
        {...args}
        placeholder="SIZES.LG (height: 48px)"
        size={SIZES.LG}
      />
    </Box>
  );
};

export const Type = (args) => (
  <Box
    display={DISPLAY.INLINE_FLEX}
    flexDirection={FLEX_DIRECTION.COLUMN}
    gap={4}
  >
    <TextField {...args} placeholder="Default" />
    <TextField
      {...args}
      type={TEXT_FIELD_TYPES.PASSWORD}
      placeholder="Password"
    />
    <TextField {...args} type="number" placeholder="Number" />
  </Box>
);

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

export const Truncate = Template.bind({});
Truncate.args = {
  placeholder: 'Truncate',
  value: 'Truncated text when truncate and width is set',
  truncate: true,
  style: { width: 240 },
};

export const LeftAccessoryRightAccessory = (args) => {
  const [value, setValue] = useState({
    search: '',
    address: '',
    amount: 1,
    accountAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
  });
  const handleOnChange = (e) => {
    setValue({ ...value, [e.target.name]: e.target.value });
  };
  const handleTokenPrice = (tokenAmount, priceUSD) => {
    return tokenAmount * priceUSD;
  };
  return (
    <Box
      display={DISPLAY.INLINE_FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
    >
      <TextField
        {...args}
        placeholder="Search"
        value={value.search}
        name="search"
        onChange={handleOnChange}
        showClear
        leftAccessory={
          <Icon
            color={COLORS.ICON_ALTERNATIVE}
            name={ICON_NAMES.SEARCH_FILLED}
          />
        }
      />
      <TextField
        {...args}
        placeholder="Public address (0x), or ENS"
        value={value.address}
        name="address"
        onChange={handleOnChange}
        rightAccessory={
          <Box
            as="button"
            display={DISPLAY.FLEX}
            style={{ padding: 0 }}
            backgroundColor={COLORS.TRANSPARENT}
            onClick={() => alert('Scan QR code')}
          >
            <Icon
              color={COLORS.PRIMARY_DEFAULT}
              name={ICON_NAMES.SCAN_BARCODE_FILLED}
            />
          </Box>
        }
      />
      <TextField
        {...args}
        placeholder="Enter amount"
        value={value.amount}
        name="amount"
        onChange={handleOnChange}
        type="number"
        truncate
        leftAccessory={
          <Box
            as="button"
            style={{ padding: 0 }}
            backgroundColor={COLORS.TRANSPARENT}
            gap={1}
            display={DISPLAY.FLEX}
            alignItems={ALIGN_ITEMS.CENTER}
          >
            <AvatarToken
              tokenName="ast"
              tokenImageUrl="./AST.png"
              size={SIZES.SM}
            />
            <Text>AST</Text>
            <Icon
              name={ICON_NAMES.ARROW_DOWN}
              color={COLORS.ICON_DEFAULT}
              size={SIZES.SM}
            />
          </Box>
        }
        rightAccessory={
          <Text variant={TEXT.BODY_SM} color={COLORS.TEXT_ALTERNATIVE}>
            = ${handleTokenPrice(value.amount, 0.11)}
          </Text>
        }
      />
      <TextField
        {...args}
        placeholder="Public address (0x), or ENS"
        value={value.accountAddress}
        name="accountAddress"
        onChange={handleOnChange}
        truncate
        leftAccessory={
          value.accountAddress && (
            <BaseAvatar size={SIZES.SM}>
              <Jazzicon address={value.accountAddress} />
            </BaseAvatar>
          )
        }
        rightAccessory={
          value.accountAddress.length === 42 && (
            <Icon
              name={ICON_NAMES.CHECK_OUTLINE}
              color={COLORS.SUCCESS_DEFAULT}
            />
          )
        }
      />
    </Box>
  );
};

export const InputRef = (args) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const handleOnClick = () => {
    inputRef.current.focus();
  };
  const handleOnChange = (e) => {
    setValue(e.target.value);
  };
  return (
    <>
      <TextField
        {...args}
        inputRef={inputRef}
        value={value}
        onChange={handleOnChange}
      />
      <Box
        as="button"
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        color={COLORS.TEXT_DEFAULT}
        borderColor={COLORS.BORDER_DEFAULT}
        borderRadius={SIZES.XL}
        marginLeft={1}
        paddingLeft={2}
        paddingRight={2}
        onClick={handleOnClick}
      >
        Edit
      </Box>
    </>
  );
};

export const AutoComplete = Template.bind({});
AutoComplete.args = {
  autoComplete: true,
  type: 'password',
  placeholder: 'Enter password',
};

export const AutoFocus = Template.bind({});
AutoFocus.args = { autoFocus: true };

export const Disabled = Template.bind({});
Disabled.args = { disabled: true };

export const ErrorStory = Template.bind({});
ErrorStory.args = { error: true };
ErrorStory.storyName = 'Error';

export const MaxLength = Template.bind({});
MaxLength.args = { maxLength: 10, placeholder: 'Max length 10' };

export const ReadOnly = Template.bind({});
ReadOnly.args = { readOnly: true, value: 'Read only' };

export const Required = Template.bind({});
Required.args = { required: true, placeholder: 'Required' };
