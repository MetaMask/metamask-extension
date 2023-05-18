import { TextProps } from '../text';

export interface LabelProps extends TextProps {
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
