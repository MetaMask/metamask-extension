import {
  BackgroundColor,
  BorderColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import type { PolymorphicComponentPropWithRef } from '../box';
import type { TextStyleUtilityProps } from '../text';

export enum AvatarBaseSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
}

export interface AvatarBaseStyleUtilityProps extends TextStyleUtilityProps {
  /**
   * The size of the AvatarBase.
   * Possible values could be 'AvatarBaseSize.Xs'(16px), 'AvatarBaseSize.Sm'(24px),
   * 'AvatarBaseSize.Md'(32px), 'AvatarBaseSize.Lg'(40px), 'AvatarBaseSize.Xl'(48px)
   * Defaults to AvatarBaseSize.Md
   */
  size?: AvatarBaseSize;
  /**
   * The children to be rendered inside the AvatarBase
   */
  children?: React.ReactNode;
  /**
   * The background color of the AvatarBase
   * Defaults to Color.backgroundAlternative
   */
  backgroundColor?: BackgroundColor;
  /**
   * The background color of the AvatarBase
   * Defaults to Color.borderDefault
   */
  borderColor?: BorderColor;
  /**
   * The color of the text inside the AvatarBase
   * Defaults to TextColor.textDefault
   */
  color?: TextColor;
  /**
   * Additional classNames to be added to the AvatarBase
   */
  className?: string;
}

export type AvatarBaseProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, AvatarBaseStyleUtilityProps>;

export type AvatarBaseComponent = <C extends React.ElementType = 'span'>(
  props: AvatarBaseProps<C>,
) => React.ReactElement | null;
