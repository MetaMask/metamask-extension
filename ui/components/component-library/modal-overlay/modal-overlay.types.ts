import { BoxComponent } from '../box/box.types';

export interface ModalOverlayProps extends BoxComponent {
  /**
   * onClick handler for the overlay
   * Not necessary when used with Modal and closeOnClickOutside is true
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  /**
   * Additional className to add to the ModalOverlay
   */
  className?: string;
}
