import React from 'react';
import type { PolymorphicComponentPropWithRef } from '../box';
import { TextFieldProps } from '../text-field/text-field.types';
import { ButtonIconProps } from '../button-icon';
import { InputProps } from '../input';

export enum TextFieldSearchSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

// Define the type for the clearButtonOnClick function
type ClearButtonOnClick = (
  props: ButtonIconProps<'span'>,
  propName: keyof ButtonIconProps<'span'>,
  componentName: string,
) => Error | null;

export interface TextFieldSearchStyleUtilityProps
  extends Omit<TextFieldProps<'input'>, 'type'> {
  /**
   * The value of the TextFieldSearch
   */
  value?: string | number;
  /**
   * The onChange handler of the TextFieldSearch
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * The clear button for the TextFieldSearch.
   * Defaults to true
   */
  showClearButton?: boolean;
  /**
   * The onClick handler for the clear button
   * Required unless showClearButton is false
   */
  clearButtonOnClick?: ClearButtonOnClick;
  /**
   * The props to pass to the clear button
   */
  clearButtonProps?: ButtonIconProps<'button'>;
  /**
   * An additional className to apply to the TextFieldSearch
   */
  className?: string;
  /**
   * Component to appear on the right side of the input
   */
  endAccessory?: React.ReactNode;
  /**
   * Attributes applied to the `input` element.
   */
  inputProps?: InputProps<'input'>;
}

export type TextFieldSearchProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TextFieldSearchStyleUtilityProps>;

export type TextFieldSearchComponent = <C extends React.ElementType = 'input'>(
  props: TextFieldSearchProps<C>,
) => React.ReactElement | null;
