import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface TemplateStyleUtilityProps extends StyleUtilityProps {
  /*
   * Additional classNames to be added to the Template component
   */
  className?: string;
}

export type TemplateProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TemplateStyleUtilityProps>;

export type TemplateComponent = <C extends React.ElementType = 'div'>(
  props: TemplateProps<C>,
) => React.ReactElement | null;
