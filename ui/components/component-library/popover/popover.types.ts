import React from 'react';
import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
  BoxProps,
} from '../box';

export enum PopoverPosition {
  Auto = 'auto',
  Top = 'top',
  TopStart = 'top-start',
  TopEnd = 'top-end',
  Right = 'right',
  RightStart = 'right-start',
  RightEnd = 'right-end',
  Bottom = 'bottom',
  BottomStart = 'bottom-start',
  BottomEnd = 'bottom-end',
  Left = 'left',
  LeftStart = 'left-start',
  LeftEnd = 'left-end',
}

export enum PopoverRole {
  Tooltip = 'tooltip',
  Dialog = 'dialog',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface PopoverStyleUtilityProps extends StyleUtilityProps {
  /**
   * The contents within the Popover
   */
  children?: React.ReactNode;
  /**
   * Additional classNames to be added to the Popover component
   */
  className?: string;
  /**
   * The position of the Popover. Possible values could be  PopoverPosition.Auto, PopoverPosition.AutoStart, PopoverPosition.AutoEnd, PopoverPosition.Top, PopoverPosition.TopStart, PopoverPosition.TopEnd, PopoverPosition.Right, PopoverPosition.RightStart, PopoverPosition.RightEnd, PopoverPosition.Bottom, PopoverPosition.BottomStart, PopoverPosition.BottomEnd, PopoverPosition.Left, PopoverPosition.LeftStart, PopoverPosition.LeftEnd
   */
  position?: PopoverPosition;
  /**
   * Use `PopoverRole.Dialog` if the content is interactive, or `PopoverRole.Tooltip` for purely informational popovers.
   */
  role?: PopoverRole;
  /**
   * Boolean to show or hide the Popover arrow pointing to the reference element
   * Default: false
   */
  hasArrow?: boolean;
  /**
   * Pass any `BoxProps` to the Popover arrow
   */
  arrowProps?: BoxProps<'div'>;
  /**
   * Boolean to control the width of the Popover to match the width of the reference element
   * Default: false
   */
  matchWidth?: boolean;
  /**
   * Boolean to control the Popover overflow from the page
   * When PopoverPosition.Auto this becomes true
   * Default: false
   */
  preventOverflow?: boolean;
  /**
   * Boolean to allow the Popover to flip to the opposite side if there is not enough space in the current position
   * When PopoverPosition.Auto this becomes true
   * Default: false
   */
  flip?: boolean;
  /**
   * Boolean to allow the Popover to hide fully if the reference element is hidden
   * Default: false
   */
  referenceHidden?: boolean;
  /**
   * Reference element to position the Popover
   */
  referenceElement?: HTMLElement | null;
  /**
   * Boolean to let the Popover know if it is open or not
   */
  isOpen?: boolean;
  /**
   * Offset to be applied to the Popover horizontal and vertical offsets in pixels
   * Requires an array of two numbers
   * default: [0, 8]
   */
  offset?: [number, number];
  /**
   * Boolean to allow the Popover to be rendered in a createPortal
   */
  isPortal?: boolean;
  /**
   * Pass a close function for the escape key callback to close the Popover
   */
  onPressEscKey?: () => void;
  /**
   * On click outside callback to close the Popover
   */
  onClickOutside?: () => void;
}

export type PopoverProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, PopoverStyleUtilityProps>;

export type PopoverComponent = <C extends React.ElementType = 'div'>(
  props: PopoverProps<C>,
) => React.ReactElement | null;
