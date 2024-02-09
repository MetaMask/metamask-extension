import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface SelectOptionStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the SelectOption component
   */
  className?: string;
  /*
   * Children of the SelectOption component
   */
  children?: any;
  /*
   * The value of the SelectOption component
   */
  value?: any;
}

export type SelectOptionProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectOptionStyleUtilityProps>;

export type SelectOptionComponent = <C extends React.ElementType = 'div'>(
  props: SelectOptionProps<C>,
) => React.ReactElement | null;
