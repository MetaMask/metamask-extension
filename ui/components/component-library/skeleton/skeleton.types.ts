import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface SkeletonStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the Skeleton component
   */
  className?: string;
}

export type SkeletonProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SkeletonStyleUtilityProps>;

export type SkeletonComponent = <C extends React.ElementType = 'div'>(
  props: SkeletonProps<C>,
) => React.ReactElement | null;
