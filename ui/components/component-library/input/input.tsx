import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  TextVariant,
  BackgroundColor,
  BorderStyle,
} from '../../../helpers/constants/design-system';

// import Box from '../../ui/box';

import { Text } from '../text';

import {InputProps, InputType} from "./input.types"

// import { InputType } from './input.types';

export const Input = forwardRef(
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
      type = InputType.Text,
      value,
      textVariant = TextVariant.bodyMd,
      disableStateStyles,
      ...props
    }: InputProps,
    ref: Ref<HTMLElement>,
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

Input.displayName = 'Input';
