import React from 'react';
import classnames from 'classnames';

import {
  TextVariant,
  BackgroundColor,
  BorderStyle,
} from '../../../helpers/constants/design-system';

import { Text, TextProps } from '../text';
import { PolymorphicRef } from '../box';
import { InputProps, InputType, InputComponent } from './input.types';

export const Input: InputComponent = React.forwardRef(
  <C extends React.ElementType = 'input'>(
    {
      autoComplete,
      autoFocus,
      className = '',
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
    }: InputProps<C>,
    ref: PolymorphicRef<C>,
  ) => (
    <Text
      className={classnames(
        'mm-input',
        {
          'mm-input--disable-state-styles': Boolean(disableStateStyles),
          'mm-input--disabled':
            Boolean(disabled) && Boolean(disableStateStyles),
        },
        className,
      )}
      {...(error && { 'aria-invalid': error })}
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
      {...(props as TextProps<C>)}
    />
  ),
);
