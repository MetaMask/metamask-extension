import {
  BackgroundColor,
  BorderColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { IconName, IconProps } from '../icon';
import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
import { ValidTag } from '../text/text.types';
import type { BoxProps } from '../../ui/box/box.d';

export enum AvatarIconSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export interface AvatarIconProps extends BoxProps {
  /**
   * The name of the icon to display. Should be one of IconName
   */
  iconName: IconName;
  /**
   * Props for the icon inside AvatarIcon. All Icon props can be used
   */
  iconProps?: Omit<IconProps, 'name'> & {
    'data-testid'?: string;
  };
  /**
   * The size of the AvatarIcon
   * Possible values could be 'AvatarIconSize.Xs' 16px, 'AvatarIconSize.Sm' 24px, 'AvatarIconSize.Md' 32px, 'AvatarIconSize.Lg' 40px, 'AvatarIconSize.Xl' 48px
   * Defaults to AvatarIconSize.Md
   */
  size?: AvatarIconSize | AvatarBaseSize;
  /**
   * The background color of the AvatarIcon
   * Defaults to BackgroundColor.primaryMuted
   */
  backgroundColor?: BackgroundColor;
  /**
   * The color of the text inside the AvatarIcon
   * Defaults to TextColor.primaryDefault
   */
  color?: TextColor | IconColor;
  /**
   * Additional classNames to be added to the AvatarIcon
   */
  className?: string;
  /**
   * The background color of the AvatarBase
   * Defaults to Color.borderDefault
   */
  borderColor?: BorderColor;
  /**
   * Changes the root html element tag of the Text component.
   */
  as?: ValidTag;
}
