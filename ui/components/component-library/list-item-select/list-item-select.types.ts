import type { PolymorphicComponentPropWithRef } from '../box';
import type { ListItemStyleUtilityProps } from '../list-item/list-item.types';

export interface ListItemSelectStyleUtilityProps
  extends ListItemStyleUtilityProps {
  /*
   * Additional classNames to be added to the ListItemSelect component
   */
  className?: string;
  /*
   * isSelected boolean to set visual state to selected
   */
  isSelected?: boolean;
}

export type ListItemSelectProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, ListItemSelectStyleUtilityProps>;

export type ListItemSelectComponent = <C extends React.ElementType = 'div'>(
  props: ListItemSelectProps<C>,
) => React.ReactElement | null;
