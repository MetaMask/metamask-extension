import { TextProps, ValidTagType } from '../text/text.types';
import type {
  PolymorphicComponentPropWithRef,
  StyleUtilityProps,
} from '../box';
import { IconName, IconProps } from '../icon';

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
  /**
   * The name of the icon to be used in the Tag component
   */
  startIconName?: IconName;
  /**
   * The icon props of the component. Most Icon component props can be used
   */
  startIconProps?: Omit<IconProps<'span'>, 'name'>;
}

export type TagProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, TagStyleUtilityProps>;

export type TagComponent = <C extends React.ElementType = 'div'>(
  props: TagProps<C>,
) => React.ReactElement | null;
