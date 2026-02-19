import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';

export type SuccessPillStyleUtilityProps = {
  /**
   * The text content of the pill (e.g. "Paid by MetaMask", "No network fee")
   */
  label: string | React.ReactNode;
} & StyleUtilityProps;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SuccessPillProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SuccessPillStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type SuccessPillComponent = <C extends React.ElementType = 'div'>(
  props: SuccessPillProps<C>,
) => React.ReactElement | null;
