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

/**
 * Makes all props optional so that if a prop object is used not ALL required props need to be passed
 * TODO: Move to appropriate place in app as this will be highly reusable
 */
type MakePropsOptional<T> = {
  [K in keyof T]?: T[K];
};

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface TextFieldSearchStyleUtilityProps
  extends Omit<TextFieldProps<'input'>, 'type' | 'size'> {
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
  clearButtonOnClick?: () => void;
  /**
   * The props to pass to the clear button
   */
  clearButtonProps?: MakePropsOptional<ButtonIconProps<'button'>>;
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
  /**
   * The size of the TextFieldSearch
   */
  size?: TextFieldSearchSize;
}

export type TextFieldSearchProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TextFieldSearchStyleUtilityProps>;

export type TextFieldSearchComponent = <C extends React.ElementType = 'input'>(
  props: TextFieldSearchProps<C>,
) => React.ReactElement | null;
