import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';
import { Size } from '../../../helpers/constants/design-system';
import { AvatarBaseSize } from '../avatar-base';

export enum AvatarAccountVariant {
  Jazzicon = 'jazzicon',
  Blockies = 'blockies',
}

export enum AvatarAccountSize {
  Xs = Size.XS,
  Sm = Size.SM,
  Md = Size.MD,
  Lg = Size.LG,
  Xl = Size.XL,
}

export const AvatarAccountDiameter = {
  [AvatarAccountSize.Xs]: 16,
  [AvatarAccountSize.Sm]: 24,
  [AvatarAccountSize.Md]: 32,
  [AvatarAccountSize.Lg]: 40,
  [AvatarAccountSize.Xl]: 48,
} as const;

export interface AvatarAccountStyleUtilityProps extends StyleUtilityProps {
  /**
   * The size of the AvatarAccount.
   * Possible values could be 'AvatarAccountSize.Xs', 'AvatarAccountSize.Sm', 'AvatarAccountSize.Md', 'AvatarAccountSize.Lg', 'AvatarAccountSize.Xl'
   * Defaults to AvatarAccountSize.Md
   */
  size?: AvatarAccountSize | AvatarBaseSize;
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

export type AvatarAccountComponent = <C extends React.ElementType = 'span'>(
  props: AvatarAccountProps<C>,
) => React.ReactElement | null;
