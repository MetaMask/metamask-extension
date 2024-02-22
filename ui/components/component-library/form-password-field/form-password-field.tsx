import React, { useState } from 'react';
import classnames from 'classnames';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  Box,
  TextField,
  HelpText,
  HelpTextSeverity,
  Label,
  TextFieldSize,
  FormTextFieldSize,
  TextFieldType,
} from '..';
import { PolymorphicRef } from '../box';
import type { BoxProps } from '../box';
import type { TextFieldProps } from '../text-field/text-field.types';
import ShowHideToggle from '../../ui/show-hide-toggle';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FormTextFieldComponent, FormTextFieldProps } from '../form-text-field/form-text-field.types';

export const FormPasswordField: FormTextFieldComponent = React.forwardRef(
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
      placeholder,
      readOnly,
      required,
      endAccessory,
      size = FormTextFieldSize.Md,
      textFieldProps,
      truncate,
      type = 'text',
      value,
      ...props
    }: FormTextFieldProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const t = useI18nContext();
    const [showPrivateKey, setShowPrivateKey] = useState(false);

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
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={0} alignItems={AlignItems.center}>
        <TextField
          className={classnames(
            'mm-form-text-field__text-field',
            textFieldProps?.className ?? '',
          )}
          type={showPrivateKey ? TextFieldType.Text : TextFieldType.Password}
          size={size as unknown as TextFieldSize}
          width={BlockSize.ElevenTwelfths}
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
            value,
            ...(textFieldProps as TextFieldProps<'div'>),
          }}
        />
      <ShowHideToggle
        shown={showPrivateKey}
        id="show-hide-private-key"
        title={t('privateKeyShow')}
        ariaLabelShown={t('privateKeyShown')}
        ariaLabelHidden={t('privateKeyHidden')}
        onChange={() => setShowPrivateKey(!showPrivateKey)}
      />
      </Box>

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
            {helpText}
          </HelpText>
        )}
      </Box>
    );
  },
);
