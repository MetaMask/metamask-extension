import React from 'react';
import type { ButtonIconProps } from '../button-icon/button-icon.types';
import type { HeaderBaseProps } from '../header-base';

export interface PopoverHeaderProps extends HeaderBaseProps {
  /**
   * The contents within the PopoverHeader positioned middle (popular for title use case)
   */
  children?: React.ReactNode;
  /**
   * Additional classNames to be added to the PopoverHeader component
   */
  className?: string;
  /**
   * The onClick handler for the back `ButtonIcon`
   * When passed this will allow for the back `ButtonIcon` to show
   */
  onBack?: () => void;
  /**
   * The props to pass to the back `ButtonIcon`
   */
  backButtonProps?: ButtonIconProps;
  /**
   * The start (left) content area of PopoverHeader
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
  closeButtonProps?: ButtonIconProps;
  /**
   * The end (right) content area of PopoverHeader
   * Default to have the close `ButtonIcon` when `onClose` is passed, but passing a  `endAccessory` will override this
   */
  endAccessory?: React.ReactNode;
}
