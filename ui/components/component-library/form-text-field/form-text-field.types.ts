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

export interface BaseFormTextFieldStyleUtilityProps
  extends Omit<TextFieldStyleUtilityProps, 'size' | 'type'> {
  className?: string;
  size?: FormTextFieldSize;
  textFieldProps?: TextFieldProps<'input'>;
  helpText?: string | React.ReactNode;
  helpTextProps?: HelpTextProps<'div'>;
}

export interface FormTextFieldWithLabelProps
  extends BaseFormTextFieldStyleUtilityProps {
  label: string | React.ReactNode;
  labelProps?: LabelProps<'label'>;
  id: string; // id is required when label is provided
}

export interface FormTextFieldWithoutLabelProps
  extends BaseFormTextFieldStyleUtilityProps {
  label?: never;
  labelProps?: never;
  id?: string; // id is optional when label is not provided
}

export type FormTextFieldProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<
    C,
    FormTextFieldWithLabelProps | FormTextFieldWithoutLabelProps
  >;

export type FormTextFieldComponent = <C extends React.ElementType = 'input'>(
  props: FormTextFieldProps<C>,
) => React.ReactElement | null;
