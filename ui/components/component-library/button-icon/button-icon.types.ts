import type { BoxProps } from '../../ui/box/box.d';
import { IconColor, Size } from '../../../helpers/constants/design-system';

export enum ButtonIconSize {
  SM = Size.SM,
  LG = Size.LG,
}

export interface ButtonIconProps extends BoxProps {
  /**
   * String that adds an accessible name for ButtonIcon
   */
  ariaLabel: string;
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as?: string;
  /**
   * An additional className to apply to the ButtonIcon.
   */
  className?: string;
  /**
   * The color of the ButtonIcon component should use the IconColor object from
   * ./ui/helpers/constants/design-system.js
   */
  color?: IconColor;
  /**
   * Boolean to disable button
   */
  disabled?: bool;
  /**
   * When an `href` prop is passed, ButtonIcon will automatically change the root element to be an `a` (anchor) tag
   */
  href?: string;
  /**
   * The name of the icon to display. Should be one of ICON_NAMES
   */
  iconName: ICON_NAMES;
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps?: object;
  /**
   * The size of the ButtonIcon.
   * Possible values could be 'Size.SM' 24px, 'Size.LG' 32px,
   */
  size?: ButtonIconSize | Size;
}
