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
  label?: string | React.ReactNode;
  labelProps?: LabelProps<'label'>;
  textFieldProps?: TextFieldProps<'input'>;
  helpText?: string | React.ReactNode;
  helpTextProps?: HelpTextProps<'div'>;
  id?: string; // TO DO: Check this prop since looking at the JS version there is some logic to be included
}

export type FormTextFieldProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, FormTextFieldStyleUtilityProps>;

export type FormTextFieldComponent = <C extends React.ElementType = 'input'>(
  props: FormTextFieldProps<C>,
) => React.ReactElement | null;
