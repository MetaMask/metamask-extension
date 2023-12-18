import React from 'react';
import classnames from 'classnames';
import {
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
} from '..';
import { PolymorphicRef } from '../box';
import type { BoxProps } from '../box';
import type { TextFieldProps } from '../text-field/text-field.types';
import {
  FormTextFieldSize,
  FormTextFieldProps,
  FormTextFieldComponent,
} from './form-text-field.types';

const sizeMap: Record<FormTextFieldSize, TextFieldSize> = {
  [FormTextFieldSize.Sm]: TextFieldSize.Sm,
  [FormTextFieldSize.Md]: TextFieldSize.Md,
  [FormTextFieldSize.Lg]: TextFieldSize.Lg,
};

export const FormTextField: FormTextFieldComponent = React.forwardRef(
  <C extends React.ElementType = 'input'>(
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
  ) => (
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
      {...(props as BoxProps<C>)}
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
        // id={id} Todo: confirm if this is needed
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
          size: sizeMap[size],
          truncate,
          type,
          value,
          ...(textFieldProps as TextFieldProps<'input'>),
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
          {helpText}
        </HelpText>
      )}
    </Box>
  ),
);
// FormTextField.propTypes = {
//   /**
//    * The id of the FormTextField
//    * Required if label prop exists to ensure accessibility
//    *
//    * @param props - The props passed to the component.
//    * @param propName - The prop name in this case 'id'.
//    * @param componentName - The name of the component.
//    */
//   id: (props, propName, componentName) => {
//     if (props.label && !props[propName]) {
//       return new Error(
//         `If a label prop exists you must provide an ${propName} prop for the label's htmlFor attribute for accessibility. Warning coming from ${componentName} ui/components/component-library/form-text-field/form-text-field.js`,
//       );
//     }
//     return null;
//   },

//   /**
//    * FormTextField accepts all the props from TextField and Box
//    */
//   ...TextField.propTypes,
// };
