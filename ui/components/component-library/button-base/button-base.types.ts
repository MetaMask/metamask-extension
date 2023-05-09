import { ReactNode } from 'react';
import type { BoxProps } from '../../ui/box/box.d';
import {
  Color,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { TextDirection, TextProps, ValidTag } from '../text';
import { Icon, IconName } from '../icon';

export enum ButtonBaseSize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export type ButtonOrAnchorTag = ValidTag.Button | ValidTag.A;

export interface ButtonBaseProps extends BoxProps {
  /**
   * The polymorphic `as` prop allows you to change the root HTML element of the Button component between `button` and `a` tag
   */
  as?: ButtonOrAnchorTag;
  /**
   * Boolean prop to quickly activate box prop display block
   */
  block?: boolean;
  /**
   * Additional props to pass to the Text component that wraps the button children
   */
  buttonTextProps?: TextProps;
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
  startIconProps?: Omit<React.ComponentProps<typeof Icon>, 'name'> & {
    'data-testid'?: string;
  };
  /**
   * Add icon to end (right side) of button text passing icon name
   * The name of the icon to display. Should be one of IconName
   */
  endIconName?: IconName;
  /**
   * iconProps accepts all the props from Icon
   */
  endIconProps?: Omit<React.ComponentProps<typeof Icon>, 'name'> & {
    'data-testid'?: string;
  };
  /**
   * iconLoadingProps accepts all the props from Icon
   */
  iconLoadingProps?: Omit<React.ComponentProps<typeof Icon>, 'name'>;
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
   * textProps accepts all the props from Icon
   */
  textProps?: TextProps;
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
   * Sets the text color of the button text.
   */
  color?: TextColor | Color;
  /**
   * Sets the color of the button icon.
   */
  iconColor?: IconColor;
  /**
   * Direction of the text content within the button ("ltr" or "rtl").
   */
  textDirection?: TextDirection;
}
