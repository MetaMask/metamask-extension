import { BorderColor } from '../../../helpers/constants/design-system';
import type { AvatarBaseStyleUtilityProps } from '../avatar-base/avatar-base.types';
import { PolymorphicComponentPropWithRef } from '../box';
import { IconProps } from '../icon';

export enum AvatarFaviconSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export interface AvatarFaviconStyleUtilityProps
  extends Omit<AvatarBaseStyleUtilityProps, 'size' | 'children'> {
  /**
   * The src accepts the string of the image to be rendered
   */
  src?: string;
  /**
   * The alt text for the favicon avatar to be rendered
   */
  name: string;
  /**
   * Props for the fallback icon. All Icon props can be used
   */
  fallbackIconProps?: IconProps<'span'>;
  /**
   * The size of the AvatarFavicon
   * Possible values could be 'AvatarFaviconSize.Xs' 16px, 'AvatarFaviconSize.Sm' 24px, 'AvatarFaviconSize.Md' 32px, 'AvatarFaviconSize.Lg' 40px, 'AvatarFaviconSize.Xs' 48px
   * Defaults to AvatarFaviconSize.Md
   */
  size?: AvatarFaviconSize;
  /**
   * The border color of the AvatarFavicon
   * Defaults to Color.transparent
   */
  borderColor?: BorderColor;
  /**
   * Additional classNames to be added to the AvatarFavicon
   */
  className?: string;
}

export type AvatarFaviconProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, AvatarFaviconStyleUtilityProps>;

export type AvatarFaviconComponent = <C extends React.ElementType = 'span'>(
  props: AvatarFaviconProps<C>,
) => React.ReactElement | null;
