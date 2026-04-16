import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';
import { PopoverStyleUtilityProps } from '../popover';

export type SelectContextType = {
  isOpen: boolean | undefined;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  isUncontrolledOpen: boolean;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setIsUncontrolledOpen: React.Dispatch<React.SetStateAction<any | null>>;
  toggleUncontrolledOpen: () => void;
  isDanger?: boolean;
  isDisabled?: boolean;
  isMultiSelect?: boolean;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any | null;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValueChange?: any;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uncontrolledValue: any | null;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setUncontrolledValue: React.Dispatch<React.SetStateAction<any | null>>;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any | null;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placeholder?: any;
  /**
   * Selected value of SelectWrapper component.
   * Can be accessed within any component inside the SelectWrapper.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  /**
   * Default value of SelectWrapper component.
   * Can be accessed within any component inside the SelectWrapper.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  /**
   * Callback function that is called when the value of the SelectWrapper component changes.
   * The new value is passed as an argument to the function.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    string | React.JSXElementConstructor<any>
  > | null;

  /**
   * Use props from the Popover component to customize the SelectWrapper popover via popoverProps.
   */
  popoverProps?: PopoverStyleUtilityProps;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SelectWrapperProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectWrapperStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SelectWrapperComponent = <C extends React.ElementType = 'div'>(
  props: SelectWrapperProps<C>,
) => React.ReactElement | null;
