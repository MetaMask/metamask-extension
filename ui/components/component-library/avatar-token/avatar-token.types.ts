import type { PolymorphicComponentPropWithRef } from '../box';
import type { AvatarBaseStyleUtilityProps } from '../avatar-base/avatar-base.types';

export enum AvatarTokenSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

/**
 * Props for the AvatarToken component
 */
// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface AvatarTokenStyleUtilityProps
  extends Omit<AvatarBaseStyleUtilityProps, 'size' | 'children'> {
  /**
   * The name accepts the string to render the first letter of the AvatarToken. This will be used as the fallback display if no image url is passed to the src
   */
  name?: string;
  /**
   * The src accepts the string of the image to be rendered
   */
  src?: string;
  /**
   * The showHalo accepts a boolean prop to render the image with halo effect
   */
  showHalo?: boolean;
  /**
   * The size of the AvatarToken.
   * Possible values could be 'AvatarTokenSize.Xs' 16px, 'AvatarTokenSize.Sm' 24px, 'AvatarTokenSize.Md' 32px, 'AvatarTokenSize.Lg' 40px, 'AvatarTokenSize.Xl' 48px
   * Defaults to AvatarTokenSize.Md
   */
  size?: AvatarTokenSize;
}

export type AvatarTokenProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, AvatarTokenStyleUtilityProps>;

export type AvatarTokenComponent = <C extends React.ElementType = 'span'>(
  props: AvatarTokenProps<C>,
) => React.ReactElement | null;
