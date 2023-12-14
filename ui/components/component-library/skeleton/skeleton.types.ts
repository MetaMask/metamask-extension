import React from 'react';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface SkeletonStyleUtilityProps
  extends Omit<StyleUtilityProps, 'height' | 'width'> {
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
}

export type SkeletonProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SkeletonStyleUtilityProps>;

export type SkeletonComponent = <C extends React.ElementType = 'span'>(
  props: SkeletonProps<C>,
) => React.ReactElement | null;
