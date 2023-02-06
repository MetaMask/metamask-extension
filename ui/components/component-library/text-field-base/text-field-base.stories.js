import React, { useState, useRef } from 'react';
import { useArgs } from '@storybook/client-api';
import PropTypes from 'prop-types';

import {
  DISPLAY,
  FLEX_DIRECTION,
  AlignItems,
  TextVariant,
  IconColor,
  BackgroundColor,
  TextColor,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

import {
  AvatarAccount,
  AvatarToken,
  Button,
  ButtonIcon,
  ICON_NAMES,
  Icon,
  Text,
} from '..';

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

const Template = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return <TextFieldBase {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory = (args) => {
  return (
    <Box
      display={DISPLAY.INLINE_FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      gap={4}
    >
      <TextFieldBase
        {...args}
        placeholder="Size.SM (height: 32px)"
        size={Size.SM}
      />
      <TextFieldBase
        {...args}
        placeholder="Size.MD (height: 40px)"
        size={Size.MD}
      />
      <TextFieldBase
        {...args}
        placeholder="Size.LG (height: 48px)"
        size={Size.LG}
      />
    </Box>
  );
};
SizeStory.storyName = 'Size';

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
        leftAccessory={
          <Icon color={IconColor.iconAlternative} name={ICON_NAMES.SEARCH} />
        }
      />
      <TextFieldBase
        {...args}
        placeholder="Public address (0x), or ENS"
        value={value.address}
        name="address"
        onChange={handleOnChange}
        rightAccessory={
          <ButtonIcon
            iconName={ICON_NAMES.SCAN_BARCODE}
            ariaLabel="Scan QR code"
            iconProps={{ color: IconColor.primaryDefault }}
          />
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
            backgroundColor={BackgroundColor.transparent}
            gap={1}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
          >
            <AvatarToken
              tokenName="eth"
              tokenImageUrl="./images/eth_logo.svg"
              size={Size.SM}
            />
            <Text>ETH</Text>
            <Icon
              name={ICON_NAMES.ARROW_DOWN}
              color={IconColor.iconDefault}
              size={Size.SM}
            />
          </Box>
        }
        rightAccessory={
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            style={{ whiteSpace: 'nowrap' }}
          >
            = ${handleTokenPrice(value.amount, 1173.58)}
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
            <AvatarAccount size={Size.SM} address={value.accountAddress} />
          )
        }
        rightAccessory={
          value.accountAddress.length === 42 && (
            <Icon name={ICON_NAMES.CHECK} color={IconColor.successDefault} />
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
    <Box display={DISPLAY.FLEX}>
      <TextFieldBase
        {...args}
        inputRef={inputRef}
        value={value}
        onChange={handleOnChange}
      />
      <Button marginLeft={1} onClick={handleOnClick}>
        Edit
      </Button>
    </Box>
  );
};

const CustomInputComponent = React.forwardRef(
  (
    {
      as,
      autoComplete,
      autoFocus,
      defaultValue,
      disabled,
      focused,
      id,
      inputProps,
      inputRef,
      maxLength,
      name,
      onBlur,
      onChange,
      onFocus,
      padding,
      paddingLeft,
      paddingRight,
      placeholder,
      readOnly,
      required,
      value,
      variant,
      type,
      className,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      ref={ref}
      {...{ padding, paddingLeft, paddingRight, ...props }}
    >
      <Box display={DISPLAY.INLINE_FLEX}>
        <Text
          style={{ padding: 0 }}
          aria-invalid={ariaInvalid}
          ref={inputRef}
          {...{
            className,
            as,
            autoComplete,
            autoFocus,
            defaultValue,
            disabled,
            focused,
            id,
            maxLength,
            name,
            onBlur,
            onChange,
            onFocus,
            placeholder,
            readOnly,
            required,
            value,
            variant,
            type,
            ...inputProps,
          }}
        />
        <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
          GoerliETH
        </Text>
      </Box>
      <Text variant={TextVariant.bodyXs}>No conversion rate available</Text>
    </Box>
  ),
);

CustomInputComponent.propTypes = {
  /**
   * The custom input component should accepts all props that the
   * InputComponent accepts in ./text-field-base.js
   */
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  id: PropTypes.string,
  inputProps: PropTypes.object,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  maxLength: PropTypes.number,
  name: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  type: PropTypes.oneOf(Object.values(TEXT_FIELD_BASE_TYPES)),
  /**
   * Because we manipulate the type in TextFieldBase so the html element
   * receives the correct attribute we need to change the autoComplete
   * propType to a string
   */
  autoComplete: PropTypes.string,
  /**
   * The custom input component should also accept all the props from Box
   */
  ...Box.propTypes,
};

CustomInputComponent.displayName = 'CustomInputComponent';

export const InputComponent = (args) => (
  <TextFieldBase
    {...args}
    placeholder="0"
    type="number"
    size={Size.LG}
    InputComponent={CustomInputComponent}
    leftAccessory={
      <Icon color={IconColor.iconAlternative} name={ICON_NAMES.WALLET} />
    }
  />
);

InputComponent.args = { autoComplete: true };

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
