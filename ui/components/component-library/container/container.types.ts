import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface ContainerStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the Container component
   */
  className?: string;
}

export type ContainerProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ContainerStyleUtilityProps>;

export type ContainerComponent = <C extends React.ElementType = 'div'>(
  props: ContainerProps<C>,
) => React.ReactElement | null;
