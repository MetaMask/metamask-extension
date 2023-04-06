import type { BoxProps } from '../../ui/box/box.d';
import { IconName, IconSize } from '../icon';
import { Color, IconColor } from '../../../helpers/constants/design-system';

export enum ButtonIconSize {
  Sm = IconSize.Sm,
  Lg = IconSize.Lg,
}

export interface ButtonIconProps extends BoxProps {
  /**
   * String that adds an accessible name for ButtonIcon
   */
  ariaLabel: string;
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * An additional className to apply to the ButtonIcon.
   */
  className?: string;
  /**
   * The color of the ButtonIcon component should use the IconColor object from
   * ./ui/helpers/constants/design-system.js
   */
  color?: IconColor | Color;
  /**
   * Boolean to disable button
   */
  disabled?: boolean;
  /**
   * When an `href` prop is passed, ButtonIcon will automatically change the root element to be an `a` (anchor) tag
   */
  href?: string;
  /**
   * The name of the icon to display. Should be one of IconName
   */
  iconName: IconName;
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps?: object;
  /**
   * The size of the ButtonIcon.
   * Possible values could be 'ButtonIconSize.Sm' 24px, 'ButtonIconSize.Lg' 32px,
   */
  size?: ButtonIconSize;
}
