import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export enum SelectButtonSize {
  Sm = 'sm',
  Auto = 'auto',
}

export interface SelectButtonStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the SelectButton component
   */
  className?: string;
  /**
   * The size of the SelectButton.
   * Possible values could be 'SelectButtonSize.Sm', 'SelectButtonSize.Auto'
   */
  size?: SelectButtonSize;
  /*
   * Placeholder for SelectButton component
   */
  placeholder?: any;
}

export type SelectButtonProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, SelectButtonStyleUtilityProps>;

export type SelectButtonComponent = <C extends React.ElementType = 'div'>(
  props: SelectButtonProps<C>,
) => React.ReactElement | null;
