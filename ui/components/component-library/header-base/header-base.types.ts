import React from 'react';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface HeaderBaseStyleUtilityProps extends StyleUtilityProps {
  /**
   * The children is the title area of the HeaderBase
   */
  children?: React.ReactNode;
  /**
   * Use the `childrenWrapperProps` prop to define the props to the children wrapper
   */
  childrenWrapperProps?: StyleUtilityProps;
  /**
   * The start(default left) content area of HeaderBase
   */
  startAccessory?: React.ReactNode;
  /**
   * Use the `startAccessoryWrapperProps` prop to define the props to the start accessory wrapper
   */
  startAccessoryWrapperProps?: StyleUtilityProps;
  /**
   * The end (default right) content area of HeaderBase
   */
  endAccessory?: React.ReactNode;
  /**
   * Use the `endAccessoryWrapperProps` prop to define the props to the end accessory wrapper
   */
  endAccessoryWrapperProps?: StyleUtilityProps;
  /**
   * An additional className to apply to the HeaderBase
   */
  className?: string;
}

export type HeaderBaseProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, HeaderBaseStyleUtilityProps>;

export type HeaderBaseComponent = <C extends React.ElementType = 'span'>(
  props: HeaderBaseProps<C>,
) => React.ReactElement | null;
