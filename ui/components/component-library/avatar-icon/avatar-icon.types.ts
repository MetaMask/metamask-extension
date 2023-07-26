import { IconColor, TextColor } from '../../../helpers/constants/design-system';
import { IconName, IconProps, IconSize } from '../icon';
import { AvatarBaseProps } from '../avatar-base/avatar-base.types';

export enum AvatarIconSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export const avatarIconSizeToIconSize: Record<AvatarIconSize, IconSize> = {
  [AvatarIconSize.Xs]: IconSize.Xs,
  [AvatarIconSize.Sm]: IconSize.Sm,
  [AvatarIconSize.Md]: IconSize.Md,
  [AvatarIconSize.Lg]: IconSize.Lg,
  [AvatarIconSize.Xl]: IconSize.Xl,
};

export interface AvatarIconProps
  extends Omit<AvatarBaseProps, 'color' | 'children'> {
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
  size?: AvatarIconSize;
  /**
   * The color of the text inside the AvatarIcon
   * Defaults to TextColor.primaryDefault
   */
  color?: TextColor | IconColor;
}
