import React from 'react';
import type { PolymorphicComponentPropWithRef } from '../box';
import { TextFieldProps } from '../text-field/text-field.types';
import type { LabelProps } from '../label/label.types';
import type { HelpTextProps } from '../help-text/help-text.types';

export enum FormTextFieldSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export interface FormTextFieldStyleUtilityProps
  extends Omit<TextFieldProps<'input'>, 'size' | 'type'> {
  /**
   * An additional className to apply to the FormTextField
   */
  className?: string;
  /**
   * The size of the FormTextField
   */
  size?: FormTextFieldSize;
  /**
   * Label for the FormTextField
   */
  label?: string | React.ReactNode;
  /**
   * Props to be passed to the Label component
   */
  labelProps?: LabelProps<'label'>;
  /**
   * Props for the TextField component within the FormTextField
   */
  textFieldProps?: TextFieldProps<'input'>;
  /**
   * HelpText for the FormTextField
   */
  helpText?: string | React.ReactNode;
  /**
   * Props to be passed to the HelpText component
   */
  helpTextProps?: HelpTextProps<'div'>;
}

export type FormTextFieldProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, FormTextFieldStyleUtilityProps>;

export type FormTextFieldComponent = <C extends React.ElementType = 'input'>(
  props: FormTextFieldProps<C>,
) => React.ReactElement | null;
