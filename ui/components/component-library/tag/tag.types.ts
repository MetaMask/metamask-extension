import { TextProps, ValidTagType } from '../text/text.types';
import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

export interface TagStyleUtilityProps extends StyleUtilityProps {
  /**
   * The text content of the Tag component, can either be a string or ReactNode
   */
  label?: string | React.ReactNode;
  /**
   * The label props of the component. Most Text component props can be used
   */
  labelProps?: TextProps<ValidTagType>;
  /**
   * Additional classNames to be added to the Tag component
   */
  className?: string;
}

export type TagProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TagStyleUtilityProps>;

export type TagComponent = <C extends React.ElementType = 'div'>(
  props: TagProps<C>,
) => React.ReactElement | null;
