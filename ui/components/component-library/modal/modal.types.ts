import type { BoxProps } from '../../ui/box/box.d';
import type { ModalFocusProps } from './modal-focus.types';

export interface ModalProps extends ModalFocusProps, BoxProps {
  /**
   * If the modal is open or not
   */
  isOpen: boolean;
  /**
   * Fires when the modal is closed
   */
  onClose: () => void;
  /**
   * The elements to be rendered inside the modal
   * Usually ModalOverlay and ModalContent
   */
  children: React.ReactNode;
  /**
   * The class name to be applied to the modal
   */
  className?: string;
  /**
   * The modalContentRef allows for the modal to be closed when the user clicks outside of the modal
   * You should apply this ref to ModalContent or the equivalent element
   */
  modalContentRef?: React.RefObject<HTMLDivElement>;
  /**
   * isClosedOnOutsideClick enables the ability to close the modal when the user clicks outside of the modal
   *
   * @default true
   */
  isClosedOnOutsideClick?: boolean;
  /**
   * closeOnEscape enables the ability to close the modal when the user presses the escape key
   * If this is disabled there should be a close button in the modal or allow keyboard only users to close the modal with a button that is accessible via the tab key
   *
   * @default true
   */
  isClosedOnEscapeKey?: boolean;
}
