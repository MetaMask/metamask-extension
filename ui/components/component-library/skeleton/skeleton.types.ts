import React from 'react';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export type SkeletonStyleUtilityProps = Omit<
  StyleUtilityProps,
  'height' | 'width'
> & {
  /**
   * Additional className to add to the Skeleton
   */
  className?: string;
  /**
   * The height of the Skeleton
   */
  height?: number | string;
  /**
   * The width of the Skeleton
   */
  width?: number | string;
  /**
   * The children of the Skeleton
   */
  children?: React.ReactNode;
  /**
   * Whether to make children invisible or not. This enables an alternative form
   * of this component, where you use it as a wrapper around existing content
   * rather than using it on its own. This allows that content to dictate the
   * size of the skeleton rather than requiring that you supply explicit
   * dimensions.
   */
  hideChildren?: boolean;
  /**
   * Intended to be used in conjunction with hideChildren; allows for showing a
   * skeleton until a certain condition is met.
   */
  showUntil?: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SkeletonProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SkeletonStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SkeletonComponent = <C extends React.ElementType = 'span'>(
  props: SkeletonProps<C>,
) => React.ReactElement | null;
