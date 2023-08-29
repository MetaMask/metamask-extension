import React from 'react';

import type { PolymorphicComponentPropWithRef } from '../box';
import type { ButtonBaseStyleUtilityProps } from '../button-base/button-base.types';

export enum ButtonLinkSize {
  Auto = 'auto',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Inherit = 'inherit',
}

export interface ButtonLinkStyleUtilityProps
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
   * Possible size values: 'ButtonLinkSize.Auto'(auto), 'ButtonLinkSize.Sm'(32px), 'ButtonLinkSize.Md'(40px), 'ButtonLinkSize.Lg'(48px), 'ButtonLinkSize.Inherit'(inherits parents font-size)
   * Default value is 'ButtonLinkSize.Auto'.
   */
  size?: ButtonLinkSize;
}

export type ButtonLinkProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ButtonLinkStyleUtilityProps>;

export type ButtonLinkComponent = <
  C extends React.ElementType = 'button' | 'a',
>(
  props: ButtonLinkProps<C>,
) => React.ReactElement | null;
