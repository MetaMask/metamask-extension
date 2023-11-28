import { IconName, IconProps } from '../icon';
import { IconColor } from '../../../helpers/constants/design-system';
import { PolymorphicComponentPropWithRef, StyleUtilityProps } from '../box';

export enum ButtonIconSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

/**
 * Makes all props optional so that if a prop object is used not ALL required props need to be passed
 * TODO: Move to appropriate place in app as this will be highly reusable
 */
type MakePropsOptional<T> = {
  [K in keyof T]?: T[K];
};

export interface ButtonIconStyleUtilityProps extends StyleUtilityProps {
  /**
   * String that adds an accessible name for ButtonIcon
   */
  ariaLabel: string;
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as?: 'button' | 'a';
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
   * The name of the icon to display. Should be one of IconName
   */
  iconName: IconName;
  /**
   * iconProps accepts all the props from Icon
   */
  iconProps?: MakePropsOptional<IconProps<'span'>>;
  /**
   * The size of the ButtonIcon.
   * Possible values could be 'ButtonIconSize.Sm' 24px, 'ButtonIconSize.Lg' 32px,
   */
  size?: ButtonIconSize;
}

export type ButtonIconProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ButtonIconStyleUtilityProps>;

export type ButtonIconComponent = <C extends React.ElementType = 'button'>(
  props: ButtonIconProps<C>,
) => React.ReactElement | null;
