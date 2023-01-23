import React, { useState, useEffect } from 'react';
import { useArgs } from '@storybook/client-api';

import {
  SIZES,
  DISPLAY,
  COLORS,
  ALIGN_ITEMS,
  TEXT,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import {
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  HelpText,
  Icon,
  ICON_NAMES,
  Label,
  Text,
  TEXT_FIELD_SIZES,
  TEXT_FIELD_TYPES,
} from '..';

import { FormTextField } from './form-text-field';

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
  title: 'Components/ComponentLibrary/FormTextField',

  component: FormTextField,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    value: {
      control: 'text',
    },
    onChange: {
      action: 'onChange',
    },
    labelProps: {
      control: 'object',
    },
    textFieldProps: {
      control: 'object',
    },
    helpTextProps: {
      control: 'object',
    },
    showClearButton: {
      control: 'boolean',
      table: { category: 'text field props' },
    },
    clearButtonOnClick: {
      action: 'clearButtonOnClick',
      table: { category: 'text field props' },
    },
    clearButtonProps: {
      control: 'object',
      table: { category: 'text field props' },
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
    placeholder: 'Form text field',
    label: 'Label',
    id: 'form-text-field',
    helpText: 'Help text',
  },
};

const Template = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  const handleOnClear = () => {
    updateArgs({ value: '' });
  };
  return (
    <FormTextField
      {...args}
      value={value}
      onChange={handleOnChange}
      clearButtonOnClick={handleOnClear}
    />
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Id = Template.bind({});
Id.args = {
  id: 'accessible-input-id',
  label: 'If label prop exists id prop is required for accessibility',
  helpText: '',
};

export const LabelStory = Template.bind({});
LabelStory.storyName = 'Label'; // Need to use LabelStory to avoid conflict with Label component
LabelStory.args = {
  id: 'input-with-label',
  label: 'Label content appears here',
  helpText: '',
};

export const HelpTextStory = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  const handleOnClear = () => {
    updateArgs({ value: '' });
  };
  return (
    <>
      <FormTextField
        {...args}
        id="input-with-help-text"
        value={value}
        onChange={handleOnChange}
        clearButtonOnClick={handleOnClear}
        marginBottom={4}
      />
      <FormTextField
        {...args}
        id="input-with-help-text-as-error"
        error
        helpText="When error is true the help text will be rendered as an error message"
        value={value}
        onChange={handleOnChange}
        clearButtonOnClick={handleOnClear}
      />
    </>
  );
};
HelpTextStory.storyName = 'HelpText'; // Need to use HelpTextStory to avoid conflict with HelpTextStory component
HelpTextStory.args = {
  label: '',
  helpText: 'HelpText content appears here',
};

export const FormExample = () => {
  const FORM_STATE = {
    DEFAULT: 'default',
    SUCCESS: 'success',
    ERROR: 'error',
  };
  const VALIDATED_VALUES = {
    NETWORK_NAME: 'network name',
    NEW_RPC_URL: 'new rpc url',
    CHAIN_ID: 'chain id',
  };
  const ERROR_MESSAGES = {
    NETWORK_NAME: `Please enter "${VALIDATED_VALUES.NETWORK_NAME}"`,
    NEW_RPC_URL: `Please enter "${VALIDATED_VALUES.NEW_RPC_URL}"`,
    CHAIN_ID: `Please enter "${VALIDATED_VALUES.CHAIN_ID}"`,
  };
  const [submitted, setSubmitted] = useState(FORM_STATE.DEFAULT);
  const [values, setValues] = useState({
    networkName: '',
    newRpcUrl: '',
    chainId: '',
  });
  const [errors, setErrors] = useState({
    networkName: '',
    newRpcUrl: '',
    chainId: '',
  });
  useEffect(() => {
    setErrors({
      networkName:
        values.networkName &&
        values.networkName.toLowerCase() !== VALIDATED_VALUES.NETWORK_NAME
          ? ERROR_MESSAGES.NETWORK_NAME
          : '',
      newRpcUrl:
        values.newRpcUrl &&
        values.newRpcUrl.toLowerCase() !== VALIDATED_VALUES.NEW_RPC_URL
          ? ERROR_MESSAGES.NEW_RPC_URL
          : '',
      chainId:
        values.chainId &&
        values.chainId.toLowerCase() !== VALIDATED_VALUES.CHAIN_ID
          ? ERROR_MESSAGES.CHAIN_ID
          : '',
    });
  }, [
    values,
    ERROR_MESSAGES.CHAIN_ID,
    ERROR_MESSAGES.NETWORK_NAME,
    ERROR_MESSAGES.NEW_RPC_URL,
    VALIDATED_VALUES.CHAIN_ID,
    VALIDATED_VALUES.NETWORK_NAME,
    VALIDATED_VALUES.NEW_RPC_URL,
  ]);
  const handleClearForm = () => {
    setValues({ networkName: '', newRpcUrl: '', chainId: '' });
    setErrors({ networkName: '', newRpcUrl: '', chainId: '' });
    setSubmitted(FORM_STATE.DEFAULT);
  };
  const handleOnChange = (e) => {
    if (submitted === FORM_STATE.ERROR) {
      setErrors({ networkName: '', newRpcUrl: '', chainId: '' });
      setSubmitted(FORM_STATE.DEFAULT);
    }
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };
  const handleOnSubmit = (e) => {
    e.preventDefault();
    if (errors.networkName || errors.newRpcUrl || errors.chainId) {
      setSubmitted(FORM_STATE.ERROR);
    } else {
      setSubmitted(FORM_STATE.SUCCESS);
    }
  };
  return (
    <>
      <Box
        as="form"
        onSubmit={handleOnSubmit}
        marginBottom={4}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <FormTextField
          marginBottom={4}
          label="Network name"
          placeholder="Enter 'network name'"
          required
          name="networkName"
          id="networkName"
          onChange={handleOnChange}
          value={values.networkName}
          error={Boolean(submitted === FORM_STATE.ERROR && errors.networkName)}
          helpText={submitted === FORM_STATE.ERROR ? errors.networkName : null}
        />
        <FormTextField
          marginBottom={4}
          label="New RPC URL"
          placeholder="Enter 'new RPC URL'"
          required
          name="newRpcUrl"
          id="newRpcUrl"
          onChange={handleOnChange}
          value={values.newRpcUrl}
          error={Boolean(submitted === FORM_STATE.ERROR && errors.newRpcUrl)}
          helpText={submitted === FORM_STATE.ERROR ? errors.newRpcUrl : null}
        />
        <FormTextField
          label="Chain ID"
          marginBottom={4}
          placeholder="Enter 'chain ID'"
          required
          name="chainId"
          id="chainId"
          onChange={handleOnChange}
          value={values.chainId}
          error={Boolean(submitted === FORM_STATE.ERROR && errors.chainId)}
          helpText={submitted === FORM_STATE.ERROR ? errors.chainId : null}
        />
        <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER} gap={1}>
          <ButtonPrimary type="submit">Submit</ButtonPrimary>
        </Box>
      </Box>
      <ButtonSecondary
        iconName={ICON_NAMES.CLOSE_OUTLINE}
        onClick={handleClearForm}
        danger
      >
        Clear form
      </ButtonSecondary>
      {submitted === FORM_STATE.SUCCESS && (
        <Text
          variant={TEXT.BODY_LG}
          color={COLORS.SUCCESS_DEFAULT}
          marginTop={4}
        >
          Form successfully submitted!
        </Text>
      )}
    </>
  );
};

export const CustomLabelOrHelpText = () => (
  <>
    <Text marginBottom={4}>
      Examples of how one might customize the Label or HelpText within the
      FormTextField component
    </Text>
    <Box
      display={DISPLAY.FLEX}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
      alignItems={ALIGN_ITEMS.FLEX_END}
    >
      <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        {/* If you need a custom label
        or require adding some form of customization
        import the Label component separately */}
        <Label htmlFor="custom-spending-cap" required>
          Custom spending cap
        </Label>
        <Icon
          name={ICON_NAMES.INFO_FILLED}
          size={SIZES.SM}
          marginLeft={1}
          color={COLORS.ICON_ALTERNATIVE}
        />
      </Box>
      <ButtonLink size={SIZES.AUTO}>Use default</ButtonLink>
    </Box>
    <FormTextField
      id="custom-spending-cap"
      placeholder="Enter a number"
      rightAccessory={<ButtonLink size={SIZES.AUTO}>Max</ButtonLink>}
      marginBottom={4}
      type={TEXT_FIELD_TYPES.NUMBER}
    />
    <FormTextField
      label="Swap from"
      placeholder="0"
      type={TEXT_FIELD_TYPES.NUMBER}
    />
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
    >
      {/* If you need a custom help text
       or require adding some form of customization
       import the HelpText component separately and handle the error
       logic yourself */}
      <HelpText paddingRight={2} marginTop={1}>
        Only enter a number that you&apos;re comfortable with the contract
        accessing now or in the future. You can always increase the token limit
        later.
      </HelpText>
      <ButtonLink size={SIZES.AUTO} marginLeft="auto" marginTop={1}>
        Max
      </ButtonLink>
    </Box>
  </>
);
