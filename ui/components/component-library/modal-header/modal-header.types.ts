import React from 'react';
import type { ButtonIconProps } from '../button-icon/button-icon.types';
import type { HeaderBaseStyleUtilityProps } from '../header-base';

/**
 * Makes all props optional so that if a prop object is used not ALL required props need to be passed
 * TODO: Move to appropriate place in app as this will be highly reusable
 */
type MakePropsOptional<T> = {
  [K in keyof T]?: T[K];
};

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ModalHeaderProps extends HeaderBaseStyleUtilityProps {
  /**
   * The contents within the ModalHeader positioned middle (popular for title use case)
   */
  children?: React.ReactNode;
  /**
   * Additional classNames to be added to the ModalHeader component
   */
  className?: string;
  /**
   * The onClick handler for the back `ButtonIcon`
   * When passed this will allow for the back `ButtonIcon` to show
   */
  onBack?: () => void | undefined;
  /**
   * The props to pass to the back `ButtonIcon`
   */
  backButtonProps?: ButtonIconProps<'button'>;
  /**
   * The start (left) content area of ModalHeader
   * Default to have the back `ButtonIcon` when `onBack` is passed, but passing a  `startAccessory` will override this
   */
  startAccessory?: React.ReactNode;
  /**
   * The onClick handler for the close `ButtonIcon`
   * When passed this will allow for the close `ButtonIcon` to show
   */
  onClose?: () => void;
  /**
   * The props to pass to the close `ButtonIcon`
   */
  closeButtonProps?: MakePropsOptional<ButtonIconProps<'button'>>;
  /**
   * The end (right) content area of ModalHeader
   * Default to have the close `ButtonIcon` when `onClose` is passed, but passing a  `endAccessory` will override this
   */
  endAccessory?: React.ReactNode;
}
