import { BoxProps } from '../../ui/box/box.d';

export interface ModalFooterProps extends BoxProps {
  /**
   * Additional className to add to the ModalFooter
   */
  className?: string;
  /**
   * The custom content of the ModalFooter
   */
  children?: React.ReactNode;
  /**
   * Array of buttons that will be displayed in the footer
   */
  buttonPropsArray?: any[];
}
