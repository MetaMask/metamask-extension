import React from 'react';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';

export enum TextareaResize {
  None = 'none',
  Both = 'both',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
  Initial = 'initial',
  Inherit = 'inherit',
}

export interface TextareaStyleUtilityProps extends StyleUtilityProps {
  /**
   * If `true`, the textarea will be focused during the first mount.
   */
  autoFocus?: boolean;
  /**
   * An additional className to apply to the textarea
   */
  className?: string;
  /**
   * The default textarea value, useful when not controlling the component.
   */
  defaultValue?: string;
  /**
   * If `true`, the textarea will be disabled.
   */
  isDisabled?: boolean;
  /*
   * Please use the `isDisabled` prop instead, this prop is added only for backwards compatibility and intuitive HTML support
   */
  disabled?: boolean;
  /**
   * If `true`, the textarea will indicate an error
   */
  error?: boolean;
  /**
   * The id of the textarea element.
   */
  id?: string;
  /**
   * Max number of characters to allow
   */
  maxLength?: number;
  /**
   * Name attribute of the textarea element.
   */
  name?: string;
  /**
   * Callback fired on blur
   */
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  /**
   * Callback fired when the value is changed.
   */
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /**
   * Callback fired when the Textarea is clicked on
   */
  onClick?: (event: React.MouseEvent<HTMLTextAreaElement>) => void;
  /**
   * Callback fired on focus
   */
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  /**
   * The short hint displayed in the textarea before the user enters a value.
   */
  placeholder?: string;
  /**
   * It prevents the user from changing the value of the field (not from interacting with the field).
   */
  readOnly?: boolean;
  /**
   * If `true`, the textarea will be required. Currently no visual difference is shown.
   */
  required?: boolean;
  /**
   * The resize property specifies whether or not an element is resizable by the user.
   */
  resize?: TextareaResize;
  /**
   * Number of rows to display when multiline option is set to true
   */
  rows?: number;
  /**
   * Number of columns to display when multiline option is set to true
   */
  cols?: number;
  /**
   * The textarea value, required for a controlled component.
   */
  value?: string | number;
}

export type TextareaProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TextareaStyleUtilityProps>;

export type TextareaComponent = <C extends React.ElementType = 'textarea'>(
  props: TextareaProps<C>,
) => React.ReactElement | null;
