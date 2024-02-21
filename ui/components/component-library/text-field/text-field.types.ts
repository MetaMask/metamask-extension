import React from 'react';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';
import { InputProps } from '../input';
import { InputComponent } from '../input/input.types';

export enum TextFieldSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export enum TextFieldType {
  Text = 'text',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Number = 'number',
  Password = 'password',
  Search = 'search',
}

export interface TextFieldStyleUtilityProps
  extends Omit<StyleUtilityProps, 'type'> {
  /**
   * Autocomplete allows the browser to predict the value based on earlier typed values
   */
  autoComplete?: boolean;
  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus?: boolean;
  /**
   * An additional className to apply to the text-field
   */
  className?: string;
  /**
   * The default input value, useful when not controlling the component.
   */
  defaultValue?: string | number;
  /**
   * If `true`, the input will be disabled.
   */
  disabled?: boolean;
  /**
   * If `true`, the input will indicate an error
   */
  error?: boolean;
  /**
   * The id of the `input` element.
   */
  id?: string;
  /**
   * The component that is rendered as the input
   * Defaults to the Text component
   */
  InputComponent?: InputComponent;
  /**
   * Attributes applied to the `input` element.
   */
  inputProps?: InputProps<'input'>;
  /**
   * Component to appear on the left side of the input
   */
  startAccessory?: React.ReactNode;
  /**
   * Component to appear on the right side of the input
   */
  endAccessory?: React.ReactNode;
  /**
   * Use inputRef to pass a ref to the html input element.
   */
  inputRef?:
    | React.MutableRefObject<HTMLInputElement | null>
    | ((instance: HTMLInputElement | null) => void);
  /**
   * Max number of characters to allow
   */
  maxLength?: number;
  /**
   * Name attribute of the `input` element.
   */
  name?: string;
  /**
   * Callback fired on blur
   */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /**
   * Callback fired when the value is changed.
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Callback fired when the TextField is clicked on
   */
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  /**
   * Callback fired on focus
   */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /**
   * The short hint displayed in the input before the user enters a value.
   */
  placeholder?: string;
  /**
   * It prevents the user from changing the value of the field (not from interacting with the field).
   */
  readOnly?: boolean;
  /**
   * If `true`, the input will be required. Currently no visual difference is shown.
   */
  required?: boolean;
  /**
   * The size of the text field. Changes the height of the component
   * Accepts TextFieldSize.Sm(32px), TextFieldSize.Md(40px), TextFieldSize.Lg(48px)
   */
  size?: TextFieldSize;
  /**
   * Type of the input element. Can be TextFieldType.Text, TextFieldType.Password, TextFieldType.Number
   * Defaults to TextFieldType.Text ('text')
   */
  type?: TextFieldType;
  /**
   * If true will ellipse the text of the input
   * Defaults to true
   */
  truncate?: boolean;
  /**
   * The input value, required for a controlled component.
   */
  value?: string | number;
  /**
   * Data test ID for the InputComponent component
   */
  testId?: string;
}

export type TextFieldProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TextFieldStyleUtilityProps>;

export type TextFieldComponent = <C extends React.ElementType = 'div'>(
  props: TextFieldProps<C>,
) => React.ReactElement | null;
