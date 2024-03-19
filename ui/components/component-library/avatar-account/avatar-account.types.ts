import type { PolymorphicComponentPropWithRef } from '../box';
import { AvatarBaseStyleUtilityProps } from '../avatar-base/avatar-base.types';

export enum AvatarAccountVariant {
  Jazzicon = 'jazzicon',
  Blockies = 'blockies',
}

export enum AvatarAccountSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export const AvatarAccountDiameter: Record<AvatarAccountSize, number> = {
  [AvatarAccountSize.Xs]: 16,
  [AvatarAccountSize.Sm]: 24,
  [AvatarAccountSize.Md]: 32,
  [AvatarAccountSize.Lg]: 40,
  [AvatarAccountSize.Xl]: 48,
};

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface AvatarAccountStyleUtilityProps
  extends Omit<AvatarBaseStyleUtilityProps, 'size' | 'variant' | 'children'> {
  /**
   * The size of the AvatarAccount.
   * Possible values could be 'AvatarAccountSize.Xs', 'AvatarAccountSize.Sm', 'AvatarAccountSize.Md', 'AvatarAccountSize.Lg', 'AvatarAccountSize.Xl'
   * Defaults to AvatarAccountSize.Md
   */
  size?: AvatarAccountSize;
  /**
   * The variant of the avatar to be rendered, it can render either a AvatarAccountVariant.Jazzicon or a AvatarAccountVariant.Blockie
   */
  variant?: AvatarAccountVariant;
  /**
   * Address used for generating random image
   */
  address: string;
  /**
   * Add custom css class
   */
  className?: string;
  /**
   * AvatarAccount also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
}

export type AvatarAccountProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, AvatarAccountStyleUtilityProps>;

export type AvatarAccountComponent = <C extends React.ElementType = 'div'>(
  props: AvatarAccountProps<C>,
) => React.ReactElement | null;
