import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';
import { PopoverStyleUtilityProps } from '../popover';

export interface SelectWrapperStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the SelectWrapper component
   */
  className?: string;
  /*
   * Children of SelectWrapper component are put inside the popover
   */
  children?: React.ReactNode;
  /*
   * Placeholder for SelectWrapper component to be displayed when no value or defaultValue is set
   * Can be accessed within any component inside the SelectWrapper
   */
  placeholder?: any;
  /*
   * Selected value of SelectWrapper component
   * Can be accessed within any component inside the SelectWrapper
   */
  value?: any;
  /**
   * Default value of SelectWrapper component
   * Can be accessed within any component inside the SelectWrapper
   */
  defaultValue?: any;
  /*
   * TODO: write info about type here
   */
  onValueChange?: any;
  /*
   * TODO: write info about type here
   */
  name?: string;
  /**
   * TODO: write info about type here
   */
  isOpen?: boolean;
  /*
   * TODO: write info about type here
   */
  onFocus?: () => void;
  /*
   * TODO: write info about type here
   */
  onBlur?: () => void;
  /*
   * TODO: write info about type here
   */
  triggerComponent: any;
  /*
   * TODO: write info about type here
   */
  popoverProps?: PopoverStyleUtilityProps;
}

export type SelectWrapperProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectWrapperStyleUtilityProps>;

export type SelectWrapperComponent = <C extends React.ElementType = 'div'>(
  props: SelectWrapperProps<C>,
) => React.ReactElement | null;
