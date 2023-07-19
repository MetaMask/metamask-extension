import { TextProps } from '../text/text.types';
import type { BoxProps } from '../../ui/box/box.d';

export interface TagProps extends BoxProps {
  /**
   * The text content of the Tag component
   */
  label?: string;
  /**
   * The label props of the component. Most Text component props can be used
   */
  labelProps?: TextProps;
  /**
   * Additional classNames to be added to the Tag component
   */
  className?: string;
}
