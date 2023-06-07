import { BoxProps } from '../../ui/box/box.d';

export interface ModalBodyProps extends BoxProps {
  /**
   * Additional className to add to the ModalBody
   */
  className?: string;
  /**
   * The content of the ModalBody
   */
  children?: React.ReactNode;
}
