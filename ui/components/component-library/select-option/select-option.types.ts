import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SelectOptionStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the SelectOption component
   */
  className?: string;
  /*
   * Children of the SelectOption component
   */

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
  /*
   * The value of the SelectOption component
   */

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SelectOptionProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectOptionStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SelectOptionComponent = <C extends React.ElementType = 'div'>(
  props: SelectOptionProps<C>,
) => React.ReactElement | null;
