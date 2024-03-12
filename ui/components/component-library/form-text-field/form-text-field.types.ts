import React from 'react';
import type { PolymorphicComponentPropWithRef } from '../box';
import {
  TextFieldStyleUtilityProps,
  TextFieldProps,
} from '../text-field/text-field.types';
import type { LabelProps } from '../label/label.types';
import type { HelpTextProps } from '../help-text/help-text.types';

export enum FormTextFieldSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface FormTextFieldStyleUtilityProps
  extends Omit<TextFieldStyleUtilityProps, 'size' | 'type'> {
  /*
   * Additional classNames to be added to the FormTextField component
   */
  className?: string;
  /*
   * size of the FormTextField using `FormTextFieldSize` enum
   */
  size?: FormTextFieldSize;
  /*
   * props to be passed to the TextField component
   */
  textFieldProps?: TextFieldProps<'div'>;
  /*
   * helpText to be rendered below the FormTextField
   */
  helpText?: string | React.ReactNode;
  /*
   * props to be passed to the HelpText component
   */
  helpTextProps?: HelpTextProps<'div'>;
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface FormTextFieldWithLabelProps
  extends FormTextFieldStyleUtilityProps {
  /*
   * label to be rendered above the FormTextField
   * if label is provided, id is required
   */
  label: string | React.ReactNode;
  /*
   * props to be passed to the Label component
   */
  labelProps?: LabelProps<'label'>;
  id: string; // id is required when label is provided
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface FormTextFieldWithoutLabelProps
  extends FormTextFieldStyleUtilityProps {
  /*
   * This is for when label is not provided, that way we can optionally still pass an id
   */
  label?: never;
  labelProps?: never;
  id?: string; // id is optional when label is not provided
}

export type FormTextFieldProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<
    C,
    FormTextFieldWithLabelProps | FormTextFieldWithoutLabelProps
  >;

export type FormTextFieldComponent = <C extends React.ElementType = 'div'>(
  props: FormTextFieldProps<C>,
) => React.ReactElement | null;
