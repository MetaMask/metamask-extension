import type { PolymorphicComponentPropWithRef } from '../box';
import type { TextStyleUtilityProps } from '../text';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface LabelStyleUtilityProps extends TextStyleUtilityProps {
  /**
   * The id of the input associated with the label
   */
  htmlFor?: string;
  /**
   * Additional classNames to assign to the Label component
   */
  className?: string;
  /**
   * The content of the Label component
   */
  children: string | React.ReactNode;
}

export type LabelProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, LabelStyleUtilityProps>;

export type LabelComponent = <C extends React.ElementType = 'label'>(
  props: LabelProps<C>,
) => React.ReactElement | null;
