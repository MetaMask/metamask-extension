import type { ReactNode } from 'react';

/**
 * Props for the GlobalMenuDrawer component
 */
export type GlobalMenuDrawerProps = {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;

  /**
   * Callback function called when the drawer should be closed
   */
  onClose: () => void;

  /**
   * Content to render inside the drawer
   */
  children: ReactNode;

  /**
   * Optional title for accessibility (hidden visually but available to screen readers)
   */
  title?: string;

  /**
   * Whether to show the close button in the header
   *
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Width of the drawer
   *
   * @default '400px'
   */
  width?: string;

  /**
   * Whether clicking outside the drawer closes it
   *
   * @default true
   */
  onClickOutside?: boolean;

  /**
   * Optional data-testid for testing
   */
  'data-testid'?: string;

  /**
   * Optional anchor element to help find the correct container in fullscreen mode
   */
  anchorElement?: HTMLElement | null;
};
