import { ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../box';
import { IconColor } from '../../../helpers/constants/design-system';
import { TextDirection, TextProps, TextStyleUtilityProps } from '../text';
import { IconName } from '../icon';
import type { IconProps } from '../icon';

export enum ButtonBaseSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export type ValidButtonTagType = 'button' | 'a';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ButtonBaseStyleUtilityProps
  extends Omit<TextStyleUtilityProps, 'as' | 'children' | 'ellipsis'> {
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   *
   */
  as?: ValidButtonTagType;
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block?: boolean;
  /**
   * The children to be rendered inside the ButtonBase
   */
  children?: ReactNode;
  /**
   * Boolean to disable button
   */
  disabled?: boolean;
  /**
   * When an `href` prop is passed, ButtonBase will automatically change the root element to be an `a` (anchor) tag
   */
  href?: string;
  /**
   * Used for long strings that can be cut off...
   */
  ellipsis?: boolean;
  /**
   * Boolean indicating if the link targets external content, it will cause the link to open in a new tab
   */
  externalLink?: boolean;
  /**
   * Add icon to start (left side) of button text passing icon name
   * The name of the icon to display. Should be one of IconName
   */
  startIconName?: IconName;
  /**
   * iconProps accepts all the props from Icon
   */
  startIconProps?: Partial<IconProps<'span'>>;
  /**
   * Add icon to end (right side) of button text passing icon name
   * The name of the icon to display. Should be one of IconName
   */
  endIconName?: IconName;
  /**
   * iconProps accepts all the props from Icon
   */
  endIconProps?: Partial<IconProps<'span'>>;
  /**
   * iconLoadingProps accepts all the props from Icon
   */
  iconLoadingProps?: Partial<IconProps<'span'>>;
  /**
   * Boolean to show loading spinner in button
   */
  loading?: boolean;
  /**
   * The size of the ButtonBase.
   * Possible values could be 'Size.SM'(32px), 'Size.MD'(40px), 'Size.LG'(48px),
   */
  size?: ButtonBaseSize;
  /**
   * textProps are additional props to pass to the Text component that wraps the button children
   */
  textProps?: TextProps<'span'>;
  /**
   * Specifies where to display the linked URL.
   */
  target?: string;
  /**
   * Specifies the relationship between the current document and
   * the linked URL.
   */
  rel?: string;
  /**
   * Sets the color of the button icon.
   */
  iconColor?: IconColor;
  /**
   * Direction of the text content within the button ("ltr" or "rtl").
   */
  textDirection?: TextDirection;
}

export type ButtonBaseProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ButtonBaseStyleUtilityProps>;

export type ButtonBaseComponent = <
  C extends React.ElementType = 'button' | 'a',
>(
  props: ButtonBaseProps<C>,
) => React.ReactElement | null;
