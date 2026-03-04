import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
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

/**
 * Form-oriented field: Label + TextField (DS Input) + optional HelpText.
 * Uses @metamask/design-system-react for Box and, via TextField, Input.
 */
export const FormTextField: FormTextFieldComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
    ref?: React.ForwardedRef<HTMLDivElement>,
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
        flexDirection={BoxFlexDirection.Column}
        ref={ref}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as Omit<BoxProps<any>, 'flexDirection'>)}
      >
        {label && (
          <Label
            htmlFor={id}
            marginBottom={1}
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
            onKeyPress,
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
            severity={error ? HelpTextSeverity.Danger : undefined}
            marginTop={1}
            {...helpTextProps}
            className={classnames(
              'mm-form-text-field__help-text',
              helpTextProps?.className ?? '',
            )}
          >
            {helpText as PropTypes.ReactNodeLike}
          </HelpText>
        )}
      </Box>
    );
  },
);
