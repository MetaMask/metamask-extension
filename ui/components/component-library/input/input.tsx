import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  TextVariant,
  BackgroundColor,
  BorderStyle,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Text } from '../text';

import { InputType } from './input.type';

export const Input = React.forwardRef(
  (
    {
      autoComplete,
      autoFocus,
      className,
      defaultValue,
      disabled,
      error,
      id,
      maxLength,
      name,
      onBlur,
      onChange,
      onFocus,
      placeholder,
      readOnly,
      required,
      type = 'text',
      value,
      textVariant = TextVariant.bodyMd,
      disableStateStyles,
      ...props
    },
    ref,
  ) => (
    <Text
      className={classnames(
        'mm-input',
        {
          'mm-input--disable-state-styles': disableStateStyles,
          'mm-input--disabled': disabled && !disableStateStyles,
        },
        className,
      )}
      aria-invalid={error}
      as="input"
      autoComplete={autoComplete ? 'on' : 'off'}
      autoFocus={autoFocus}
      backgroundColor={BackgroundColor.transparent}
      borderStyle={BorderStyle.none}
      defaultValue={defaultValue}
      disabled={disabled}
      id={id}
      margin={0}
      maxLength={maxLength}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      padding={0}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={ref}
      required={required}
      value={value}
      variant={textVariant}
      type={type}
      {...props}
    />
  ),
);

Input.propTypes = {
  /**
   * Autocomplete allows the browser to predict the value based on earlier typed values
   */
  autoComplete: PropTypes.bool,
  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus: PropTypes.bool,
  /**
   * An additional className to apply to the input
   */
  className: PropTypes.string,
  /**
   * The default input value, useful when not controlling the component.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * If `true`, the input will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * Disables focus state by setting CSS outline: none;
   * !!IMPORTANT!!
   * If this is set to true ensure there is a proper fallback
   * to enable accessibility for keyboard only and vision impaired users
   */
  disableStateStyles: PropTypes.bool,
  /**
   * If `true`, aria-invalid will be true
   */
  error: PropTypes.bool,
  /**
   * The id of the `input` element.
   */
  id: PropTypes.string,
  /**
   * Max number of characters to allow
   */
  maxLength: PropTypes.number,
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
   * Use this to override the text variant of the Text component.
   * Should only be used for approved custom input components
   * Use the TextVariant enum
   */
  textVariant: PropTypes.oneOf(Object.values(TextVariant)),
  /**
   * Type of the input element. Can be InputType.text, InputType.password, InputType.number
   * Defaults to InputType.text ('text')
   * If you require another type add it to InputType
   */
  type: PropTypes.oneOf(Object.values(InputType)),
  /**
   * The input value, required for a controlled component.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * Input accepts all the props from Box
   */
  ...Box.propTypes,
};

Input.displayName = 'Input';
