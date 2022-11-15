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

import { Icon, ICON_NAMES } from '../icon';
import { AvatarToken } from '../avatar-token';
import { AvatarAccount } from '../avatar-account';
import { Text } from '../text';

import {
  TEXT_FIELD_BASE_SIZES,
  TEXT_FIELD_BASE_TYPES,
} from './text-field-base.constants';
import { TextFieldBase } from './text-field-base';
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
  title: 'Components/ComponentLibrary/TextFieldBase',
  id: __filename,
  component: TextFieldBase,
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
    error: {
      control: 'boolean',
    },
    id: {
      control: 'text',
    },
    inputProps: {
      control: 'object',
    },
    leftAccessory: {
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
    onClick: {
      action: 'onClick',
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
    rightAccessory: {
      control: 'text',
    },
    size: {
      control: 'select',
      options: Object.values(TEXT_FIELD_BASE_SIZES),
    },
    type: {
      control: 'select',
      options: Object.values(TEXT_FIELD_BASE_TYPES),
    },
    value: {
      control: 'text',
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
  },
};

const Template = (args) => <TextFieldBase {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size = (args) => {
  return (
    <Box
      display={DISPLAY.INLINE_FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
    >
      <TextFieldBase
        {...args}
        placeholder="SIZES.SM (height: 32px)"
        size={SIZES.SM}
      />
      <TextFieldBase
        {...args}
        placeholder="SIZES.MD (height: 40px)"
        size={SIZES.MD}
      />
      <TextFieldBase
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
    <TextFieldBase {...args} placeholder="Default" />
    <TextFieldBase
      {...args}
      type={TEXT_FIELD_BASE_TYPES.PASSWORD}
      placeholder="Password"
    />
    <TextFieldBase
      {...args}
      type={TEXT_FIELD_BASE_TYPES.NUMBER}
      placeholder="Number"
    />
  </Box>
);

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
      <TextFieldBase
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
      <TextFieldBase
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
          >
            <Icon
              color={COLORS.PRIMARY_DEFAULT}
              name={ICON_NAMES.SCAN_BARCODE_FILLED}
            />
          </Box>
        }
      />
      <TextFieldBase
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
      <TextFieldBase
        {...args}
        placeholder="Public address (0x), or ENS"
        value={value.accountAddress}
        name="accountAddress"
        onChange={handleOnChange}
        truncate
        leftAccessory={
          value.accountAddress && (
            <AvatarAccount size={SIZES.SM} address={value.accountAddress} />
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
      <TextFieldBase
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

export const DefaultValue = Template.bind({});
DefaultValue.args = { defaultValue: 'Default value' };

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
