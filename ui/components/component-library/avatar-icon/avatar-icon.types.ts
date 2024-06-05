import { IconColor, TextColor } from '../../../helpers/constants/design-system';
import { IconName, IconProps, IconSize } from '../icon';
import type { PolymorphicComponentPropWithRef } from '../box';
import type { AvatarBaseStyleUtilityProps } from '../avatar-base/avatar-base.types';

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

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface AvatarIconStyleUtilityProps
  extends Omit<AvatarBaseStyleUtilityProps, 'size' | 'children' | 'color'> {
  /**
   * The name of the icon to display. Should be one of IconName
   */
  iconName: IconName;
  /**
   * Props for the icon inside AvatarIcon. All Icon props can be used
   */
  iconProps?: IconProps<'span'>;
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

export type AvatarIconProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, AvatarIconStyleUtilityProps>;

export type AvatarIconComponent = <C extends React.ElementType = 'span'>(
  props: AvatarIconProps<C>,
) => React.ReactElement | null;
