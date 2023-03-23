import type { HeaderBaseProps } from '../header-base';

export interface PopoverHeaderProps extends HeaderBaseProps {
  /**
   * The contents within the PopoverHeader positioned middle (popular for title use case)
   */
  children?: React.ReactNode;
  /**
   * Additional classNames to be added to the Popover component
   */
  className?: string;
  /**
   * The onClick handler for the close `ButtonIcon`
   * When passed this will allow for the close `ButtonIcon` to show
   */
  onClose?: func;
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
}
