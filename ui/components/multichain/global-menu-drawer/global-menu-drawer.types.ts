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
   * Optional data-testid for testing
   */
  'data-testid'?: string;
};
