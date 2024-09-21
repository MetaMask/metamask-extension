import type { ModalFocusProps } from '../modal-focus';

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ModalProps extends ModalFocusProps {
  /**
   * If the modal is open or not
   */
  isOpen: boolean;
  /**
   * Fires when the modal is closed
   */
  onClose: () => void;
  /**
   * The elements to be rendered inside the modal: ModalOverlay and ModalContent
   */
  children: React.ReactNode;
  /**
   * Additional className to be applied to the modal
   */
  className?: string;
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
