import type { ButtonBaseStyleUtilityProps } from '../button-base/button-base.types';
import type { PolymorphicComponentPropWithRef } from '../box';

export enum ButtonPrimarySize {
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
}

export type ValidButtonTagType = 'button' | 'a';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ButtonPrimaryStyleUtilityProps
  extends Omit<ButtonBaseStyleUtilityProps, 'size'> {
  /**
   * Boolean to change button type to Danger when true
   */
  danger?: boolean;
  /**
   * Boolean to disable button
   */
  disabled?: boolean;
  /**
   * Boolean to show loading spinner in button
   */
  loading?: boolean;
  /**
   * Possible size values: 'ButtonPrimarySize.Sm'(32px),
   * 'ButtonPrimarySize.Md'(40px), 'ButtonPrimarySize.Lg'(48px)
   * Default value is 'ButtonPrimarySize.Auto'.
   */
  size?: ButtonPrimarySize;
}

export type ButtonPrimaryProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ButtonPrimaryStyleUtilityProps>;

export type ButtonPrimaryComponent = <
  C extends React.ElementType = 'button' | 'a',
>(
  props: ButtonPrimaryProps<C>,
) => React.ReactElement | null;
