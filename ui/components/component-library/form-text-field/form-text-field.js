import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Display,
  FlexDirection,
  Size,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { TextField, TextFieldSize, TextFieldType } from '../text-field';
import { HelpText, HelpTextSeverity } from '../help-text';
import { Label } from '../label';

export const FormTextField = ({
  autoComplete,
  autoFocus,
  className,
  defaultValue,
  disabled,
  error,
  helpText,
  helpTextProps,
  id,
  inputProps,
  inputRef,
  label,
  labelProps,
  startAccessory,
  maxLength,
  name,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readOnly,
  required,
  endAccessory,
  size = Size.MD,
  textFieldProps,
  truncate,
  type = 'text',
  value,
  ...props
}) => (
  <Box
    className={classnames(
      'mm-form-text-field',
      { 'mm-form-text-field--disabled': disabled },
      className,
    )}
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    {...props}
  >
    {label && (
      <Label
        htmlFor={id}
        {...labelProps}
        className={classnames(
          'mm-form-text-field__label',
          labelProps?.className,
        )}
      >
        {label}
      </Label>
    )}
    <TextField
      className={classnames(
        'mm-form-text-field__text-field',
        textFieldProps?.className,
      )}
      id={id}
      {...{
        autoComplete,
        autoFocus,
        defaultValue,
        disabled,
        error,
        id,
        inputProps,
        inputRef,
        startAccessory,
        maxLength,
        name,
        onBlur,
        onChange,
        onFocus,
        placeholder,
        readOnly,
        required,
        endAccessory,
        size,
        truncate,
        type,
        value,
        ...textFieldProps,
      }}
    />
    {helpText && (
      <HelpText
        severity={error && HelpTextSeverity.Danger}
        marginTop={1}
        {...helpTextProps}
        className={classnames(
          'mm-form-text-field__help-text',
          helpTextProps?.className,
        )}
      >
        {helpText}
      </HelpText>
    )}
  </Box>
);

FormTextField.propTypes = {
  /**
   * An additional className to apply to the form-text-field
   */
  className: PropTypes.string,
  /**
   * The id of the FormTextField
   * Required if label prop exists to ensure accessibility
   *
   * @param {object} props - The props passed to the component.
   * @param {string} propName - The prop name in this case 'id'.
   * @param {string} componentName - The name of the component.
   */
  id: (props, propName, componentName) => {
    if (props.label && !props[propName]) {
      return new Error(
        `If a label prop exists you must provide an ${propName} prop for the label's htmlFor attribute for accessibility. Warning coming from ${componentName} ui/components/component-library/form-text-field/form-text-field.js`,
      );
    }
    return null;
  },
  /**
   * The content of the Label component
   */
  label: PropTypes.string,
  /**
   * Props that are applied to the Label component
   */
  labelProps: PropTypes.object,
  /**
   * The content of the HelpText component
   */
  helpText: PropTypes.string,
  /**
   * Props that are applied to the HelpText component
   */
  helpTextProps: PropTypes.object,
  /**
   * Props that are applied to the TextField component
   */
  textFieldProps: PropTypes.object,
  /**
   * Autocomplete allows the browser to predict the value based on earlier typed values
   */
  autoComplete: PropTypes.bool,
  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus: PropTypes.bool,
  /**
   * The default input value, useful when not controlling the component.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * If `true`, the input will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, aria-invalid will be true
   */
  error: PropTypes.bool,
  /**
   * Name attribute of the `input` element.
   */
  name: PropTypes.string,
  /**
   * Callback fired on blur
   */
  onBlur: PropTypes.func,
  /**
   * Callback fired when the value is changed.
   */
  onChange: PropTypes.func,
  /**
   * Callback fired on focus
   */
  onFocus: PropTypes.func,
  /**
   * The short hint displayed in the input before the user enters a value.
   */
  placeholder: PropTypes.string,
  /**
   * It prevents the user from changing the value of the field (not from interacting with the field).
   */
  readOnly: PropTypes.bool,
  /**
   * If `true`, the input will be required. Currently no visual difference is shown.
   */
  required: PropTypes.bool,
  /**
   * The start(default left) content area of FormTextField
   */
  startAccessory: PropTypes.node,
  /**
   * The start(default right) content area of FormTextField
   */
  endAccessory: PropTypes.node,
  /**
   * If true will ellipse the text of the input
   * Defaults to true
   */
  truncate: PropTypes.bool,
  /**
   * Max number of characters to allow
   */
  maxLength: PropTypes.number,
  /**
   * The input value, required for a controlled component.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * The size of the text field. Changes the height of the component
   * Accepts TextFieldSize.Sm(32px), TextFieldSize.Md(40px), TextFieldSize.Lg(48px)
   */
  size: PropTypes.oneOf(Object.values(TextFieldSize)),
  /**
   * Type of the input element. Can be TextFieldType.Text, TextFieldType.Password, TextFieldType.Number
   * Defaults to TextFieldType.Text ('text')
   */
  type: PropTypes.oneOf(Object.values(TextFieldType)),
  /**
   * Attributes applied to the `input` element.
   */
  inputProps: PropTypes.object,
  /**
   * Use inputRef to pass a ref to the html input element.
   */
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};
