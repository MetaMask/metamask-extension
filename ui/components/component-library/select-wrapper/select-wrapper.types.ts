import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';
import { PopoverStyleUtilityProps } from '../popover';

export type SelectContextType = {
  isOpen: boolean | undefined;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  isUncontrolledOpen: boolean;
  setIsUncontrolledOpen: React.Dispatch<React.SetStateAction<any | null>>;
  toggleUncontrolledOpen: () => void;
  isDanger?: boolean;
  isDisabled?: boolean;
  isMultiSelect?: boolean;
  value: any | null;
  onValueChange?: any;
  uncontrolledValue: any | null;
  setUncontrolledValue: React.Dispatch<React.SetStateAction<any | null>>;
  defaultValue: any | null;
  placeholder: any;
};

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SelectWrapperStyleUtilityProps extends StyleUtilityProps {
  /**
   * Additional classNames to be added to the SelectWrapper component.
   */
  className?: string;
  /**
   * Children of SelectWrapper component are put inside the select menu which uses the Popover component.
   */
  children?: React.ReactNode;
  /**
   * Placeholder for SelectWrapper component to be displayed when no value or defaultValue is set.
   * Can be accessed within any component inside the SelectWrapper.
   */
  placeholder?: any;
  /**
   * Selected value of SelectWrapper component.
   * Can be accessed within any component inside the SelectWrapper.
   */
  value?: any;
  /**
   * Default value of SelectWrapper component.
   * Can be accessed within any component inside the SelectWrapper.
   */
  defaultValue?: any;
  /**
   * Callback function that is called when the value of the SelectWrapper component changes.
   * The new value is passed as an argument to the function.
   */
  onValueChange?: (newValue: any) => void;
  /**
   * isOpen boolean determines whether the SelectWrapper popover is open or closed.
   */
  isOpen?: boolean;
  /**
   * isDisabled boolean determines whether the SelectWrapper component is disabled or not.
   */
  isDisabled?: boolean;
  /**
   * isDanger boolean determines whether the SelectWrapper component is danger
   */
  isDanger?: boolean;
  /**
   * onOpenChange callback function is called when the SelectWrapper popover is opened or closed.
   */
  onOpenChange?: any; // TO DO: confirm type
  /**
   * Callback function that is called when the SelectWrapper component loses focus.
   * The event object is passed as an argument to the function.
   */
  onBlur?: () => void;
  /**
   * The trigger component that will commonly be used with components like SelectButton.
   * SelectWrapper's popover will be anchored to this component.
   */
  triggerComponent: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  > | null;

  /**
   * Use props from the Popover component to customize the SelectWrapper popover via popoverProps.
   */
  popoverProps?: PopoverStyleUtilityProps;
}

export type SelectWrapperProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectWrapperStyleUtilityProps>;

export type SelectWrapperComponent = <C extends React.ElementType = 'div'>(
  props: SelectWrapperProps<C>,
) => React.ReactElement | null;
