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
  AvatarAccountSize,
  AvatarToken,
  Button,
  ButtonIcon,
  IconName,
  IconSize,
  Icon,
  Text,
} from '..';

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

  component: TextField,
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
    startAccessory: {
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
    endAccessory: {
      control: 'text',
    },
    size: {
      control: 'select',
      options: Object.values(TEXT_FIELD_SIZES),
    },
    type: {
      control: 'select',
      options: Object.values(TEXT_FIELD_TYPES),
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
  return <TextField {...args} value={value} onChange={handleOnChange} />;
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
      <TextField
        {...args}
        placeholder="Size.SM (height: 32px)"
        size={Size.SM}
      />
      <TextField
        {...args}
        placeholder="Size.MD (height: 40px)"
        size={Size.MD}
      />
      <TextField
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
    <TextField {...args} placeholder="Default" />
    <TextField
      {...args}
      type={TEXT_FIELD_TYPES.PASSWORD}
      placeholder="Password"
    />
    <TextField {...args} type={TEXT_FIELD_TYPES.NUMBER} placeholder="Number" />
  </Box>
);

export const Truncate = Template.bind({});
Truncate.args = {
  placeholder: 'Truncate',
  value: 'Truncated text when truncate and width is set',
  truncate: true,
  style: { width: 240 },
};

export const StartAccessoryEndAccessory = (args) => {
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
        startAccessory={
          <Icon color={IconColor.iconAlternative} name={IconName.Search} />
        }
      />
      <TextField
        {...args}
        placeholder="Public address (0x), or ENS"
        value={value.address}
        name="address"
        onChange={handleOnChange}
        endAccessory={
          <ButtonIcon
            iconName={IconName.ScanBarcode}
            ariaLabel="Scan QR code"
            iconProps={{ color: IconColor.primaryDefault }}
          />
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
        startAccessory={
          <Box
            as="button"
            style={{ padding: 0 }}
            backgroundColor={BackgroundColor.transparent}
            gap={1}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
          >
            <AvatarToken
              name="eth"
              src="./images/eth_logo.svg"
              size={Size.SM}
            />
            <Text>ETH</Text>
            <Icon
              name={IconName.ArrowDown}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
            />
          </Box>
        }
        endAccessory={
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            style={{ whiteSpace: 'nowrap' }}
          >
            = ${handleTokenPrice(value.amount, 1173.58)}
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
        startAccessory={
          value.accountAddress && (
            <AvatarAccount
              size={AvatarAccountSize.SM}
              address={value.accountAddress}
            />
          )
        }
        endAccessory={
          value.accountAddress.length === 42 && (
            <Icon name={IconName.Check} color={IconColor.successDefault} />
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
      <TextField
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
   * InputComponent accepts in ./text-field.js
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
  type: PropTypes.oneOf(Object.values(TEXT_FIELD_TYPES)),
  /**
   * Because we manipulate the type in TextField so the html element
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
  <TextField
    {...args}
    placeholder="0"
    type="number"
    size={Size.LG}
    InputComponent={CustomInputComponent}
    startAccessory={
      <Icon color={IconColor.iconAlternative} name={IconSize.Wallet} />
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
