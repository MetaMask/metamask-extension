import type { PolymorphicComponentPropWithRef } from '../box';
import type { AvatarBaseStyleUtilityProps } from '../avatar-base/avatar-base.types';

export enum AvatarNetworkSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

/**
 * Props for the AvatarNetwork component
 */
export interface AvatarNetworkStyleUtilityProps
  extends Omit<AvatarBaseStyleUtilityProps, 'size' | 'children'> {
  /**
   * The name accepts the string to render the first alphabet of the Avatar Name
   */
  name: string;
  /**
   * The src accepts the string of the image to be rendered
   */
  src?: string;
  /**
   * The showHalo accepts a boolean prop to render the image with halo effect
   */
  showHalo?: boolean;
  /**
   * The size of the AvatarNetwork
   * Possible values could be AvatarNetworkSize.Xs(16px), AvatarNetworkSize.Sm(24px), AvatarNetworkSize.Md(32px), AvatarNetworkSize.Lg(40px), AvatarNetworkSize.Xl(48px)
   * Defaults to AvatarNetworkSize.Md
   */
  size?: AvatarNetworkSize;
}

export type AvatarNetworkProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, AvatarNetworkStyleUtilityProps>;

export type AvatarNetworkComponent = <C extends React.ElementType = 'span'>(
  props: AvatarNetworkProps<C>,
) => React.ReactElement | null;
