import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box/box.types';

export type SuccessPillStyleUtilityProps = {
  /**
   * The text content of the pill (e.g. "Paid by MetaMask", "No network fee")
   */
  label: string | React.ReactNode;
} & StyleUtilityProps;

export type SuccessPillProps = PolymorphicComponentPropWithRef<
  'div',
  SuccessPillStyleUtilityProps
>;

export type SuccessPillComponent = (
  props: SuccessPillProps,
) => React.ReactElement | null;
