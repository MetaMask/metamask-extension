import * as React from 'react';

import { IconName, IconProps } from '../icon';

import { BoxProps } from '../../ui/box.d';

import { BUTTON_ICON_SIZES } from './button-icon.constants';

type ButtonIconSize = typeof BUTTON_ICON_SIZES[keyof typeof BUTTON_ICON_SIZES];

export interface ButtonIconProps extends BoxProps {
  /**
   * String that adds an accessible name for ButtonIcon
   */
  ariaLabel: string;
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as?: keyof HTMLElementTagNameMap;
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
  disabled?: boolean;
  /**
   * When an `href` prop is passed, ButtonIcon will automatically change the root element to be an `a` (anchor) tag
   */
  href?: string;
  /**
   * The name of the icon to display. Should be one of IconName enum
   */
  iconName: IconName;
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps?: IconProps;
  /**
   * The size of the ButtonIcon.
   * Possible values could be 'BUTTON_ICON_SIZES.SM' 24px, 'BUTTON_ICON_SIZES.LG' 32px,
   */
  size?: ButtonIconSize;
}

declare const ButtonIcon: React.FC<ButtonIconProps>;

export default ButtonIcon;
