import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface ListStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the List component
   */
  className?: string;
  /**
   * The children to be rendered inside the List
   */
  children?: React.ReactNode | string;
}

export type ListProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ListStyleUtilityProps>;

export type ListComponent = <C extends React.ElementType = 'div'>(
  props: ListProps<C>,
) => React.ReactElement | null;
