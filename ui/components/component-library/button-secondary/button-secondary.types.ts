import type { ButtonBaseStyleUtilityProps } from '../button-base/button-base.types';
import type { PolymorphicComponentPropWithRef } from '../box';

export enum ButtonSecondarySize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ButtonSecondaryStyleUtilityProps
  extends Omit<ButtonBaseStyleUtilityProps, 'size'> {
  /**
   * An additional className to apply to the ButtonSecondary.
   */
  className?: string;
  /**
   * When true, ButtonSecondary color becomes Danger.
   */
  danger?: boolean;
  /**
   * Boolean to disable button
   */
  disabled?: boolean;
  /**
   * Possible size values: 'ButtonSecondarySize.Sm'(32px), 'ButtonSecondarySize.Md'(40px), 'ButtonSecondarySize.Lg'(48px).
   * Default value is 'ButtonSecondarySize.Md'.
   */
  size?: ButtonSecondarySize;
}

export type ButtonSecondaryProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ButtonSecondaryStyleUtilityProps>;

export type ButtonSecondaryComponent = <
  C extends React.ElementType = 'button' | 'a',
>(
  props: ButtonSecondaryProps<C>,
) => React.ReactElement | null;
