import React from 'react';
import classnames from 'classnames';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { Box, PolymorphicRef } from '../box';
import type { BoxProps } from '../box';
import {
  TextFieldProps,
  TextFieldSize,
  TextFieldType,
} from '../text-field/text-field.types';
import { Label } from '../label';
import { TextField } from '../text-field';
import { HelpText, HelpTextSeverity } from '../help-text';
import {
  FormTextFieldSize,
  FormTextFieldProps,
  FormTextFieldComponent,
} from './form-text-field.types';

export const FormTextField: FormTextFieldComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      autoComplete,
      autoFocus,
      className = '',
      defaultValue,
      disabled,
      isDisabled,
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
      onKeyPress,
      placeholder,
      readOnly,
      required,
      endAccessory,
      size = FormTextFieldSize.Md,
      textFieldProps,
      truncate,
      type = TextFieldType.Text,
      value,
      ...props
    }: FormTextFieldProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames(
          'mm-form-text-field',
          {
            'mm-form-text-field--disabled':
              Boolean(isDisabled) || Boolean(disabled),
          },
          className,
        )}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        ref={ref}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as BoxProps<any>)}
      >
        {label && (
          <Label
            htmlFor={id}
            {...labelProps}
            className={classnames(
              'mm-form-text-field__label',
              labelProps?.className ?? '',
            )}
          >
            {label}
          </Label>
        )}
        <TextField
          className={classnames(
            'mm-form-text-field__text-field',
            textFieldProps?.className ?? '',
          )}
          size={size as unknown as TextFieldSize}
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
            truncate,
            type,
            value,
            ...(textFieldProps as TextFieldProps<'div'>),
          }}
        />
        {helpText && (
          <HelpText
            data-testid="help-text"
            severity={error ? HelpTextSeverity.Danger : undefined}
            marginTop={1}
            {...helpTextProps}
            className={classnames(
              'mm-form-text-field__help-text',
              helpTextProps?.className ?? '',
            )}
          >
            {helpText}
          </HelpText>
        )}
      </Box>
    );
  },
);
