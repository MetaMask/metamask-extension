import type { PolymorphicComponentPropWithRef } from '../box';
import type { TextStyleUtilityProps } from '../text';

export interface ListItemStyleUtilityProps extends TextStyleUtilityProps {
  /*
   * Additional classNames to be added to the ListItem component
   */
  className?: string;
  /*
   * isDisabled boolean to set visual state to disabled
   */
  isDisabled?: boolean;
  /*
   * Please use the `isDisabled` prop instead, this prop is added only for backwards compatibility and intuitive HTML support
   */
  disabled?: boolean;
  /**
   * The children to be rendered inside the ListItem
   */
  children?: React.ReactNode | string;
}

export type ListItemProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ListItemStyleUtilityProps>;

export type ListItemComponent = <C extends React.ElementType = 'div'>(
  props: ListItemProps<C>,
) => React.ReactElement | null;
