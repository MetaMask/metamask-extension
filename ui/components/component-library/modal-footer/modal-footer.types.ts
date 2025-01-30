import React from 'react';
import type { ContainerProps } from '../container';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';
import type { ButtonProps } from '../button';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ModalFooterStyleUtilityProps extends StyleUtilityProps {
  /**
   * Additional className to add to the ModalFooter
   */
  className?: string;
  /**
   * The custom content of the ModalFooter
   */
  children?: React.ReactNode;
  /**
   * The submit button click event handler if this exists the submit button will be displayed
   */
  onSubmit?: () => void;
  /**
   * Additional props to pass to the submit button
   */
  submitButtonProps?: ButtonProps<'button'>;
  /**
   * The cancel button click event handler if this exists the cancel button will be displayed
   */
  onCancel?: () => void;
  /**
   * Additional props to pass to the cancel button
   */
  cancelButtonProps?: ButtonProps<'button'>;
  /**
   * Additional props to pass to the internal Container component that wraps the buttons
   */
  containerProps?: ContainerProps<'div'>;
}

export type ModalFooterProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ModalFooterStyleUtilityProps>;

export type ModalFooterComponent = <C extends React.ElementType = 'footer'>(
  props: ModalFooterProps<C>,
) => React.ReactElement | null;
