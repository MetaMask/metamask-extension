import type { BoxProps } from '../../ui/box/box.d';
import { Text } from '..';

export interface PopoverProps extends BoxProps {
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
   * Boolean to show or hide the Popover arrow pointing to the reference element
   * Default: false
   */
  hasArrow?: boolean;
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
   * Popover title
   */
  title?: string;
  /**
   * Popover title props to be passed to the Text component
   */
  titleProps?: Text.propTypes;
  /**
   * The onClick handler for the close `ButtonIcon`
   * When passed this will allow for the close `ButtonIcon` to show
   */
  onClose?: func;
  /**
   * The onClick handler for the close `ButtonIcon`
   * When passed this will allow for the close `ButtonIcon` to show
   */
  offset?: array;
  /**
   * The props to pass to the close `ButtonIcon`
   */
  closeButtonProps?: ButtonIconProps;
  /**
   * The onClick handler for the back `ButtonIcon`
   * When passed this will allow for the back `ButtonIcon` to show
   */
  onBack?: func;
  /**
   * The props to pass to the back `ButtonIcon`
   */
  backButtonProps?: ButtonIconProps;
  /**
   * Boolean to allow the Popover to be rendered in a createPortal
   */
  isPortal?: boolean;
}
