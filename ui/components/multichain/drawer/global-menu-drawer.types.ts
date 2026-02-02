/**
 * Type definitions for GlobalMenuDrawer component
 */

import type { ReactNode } from 'react';

export type GlobalMenuDrawerProps = {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;
  /**
   * Callback to close the drawer
   */
  closeMenu: () => void;
  /**
   * Children to render inside the drawer
   */
  children?: ReactNode;
  /**
   * Anchor element (hamburger button) to help find the correct container
   */
  anchorElement?: HTMLElement | null;
};
