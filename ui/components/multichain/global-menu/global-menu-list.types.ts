import { ReactNode } from 'react';
import {
  IconName,
  IconColor,
  TextColor,
} from '@metamask/design-system-react';

/**
 * Base properties shared by all menu items
 */
type GlobalMenuItemBase = {
  /**
   * Unique identifier for the menu item
   */
  id: string;
  /**
   * Icon name to display
   */
  iconName: IconName;
  /**
   * Label text for the menu item
   */
  label: string;
  /**
   * Optional badge count or custom badge component
   */
  badge?: number | ReactNode;
  /**
   * Optional subtitle text
   */
  subtitle?: string;
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  /**
   * Optional info dot indicator
   */
  showInfoDot?: boolean;
  /**
   * Whether to show chevron icon on the right (default: true)
   */
  showChevron?: boolean;
  /**
   * Optional custom icon color
   */
  iconColor?: IconColor;
  /**
   * Optional custom text color
   */
  textColor?: TextColor;
};

/**
 * Represents a menu item that navigates to a route
 * When `to` is provided, React Router handles navigation automatically.
 * `onClick` is optional and can be used for side effects like closing the menu,
 * tracking analytics, or performing actions before/after navigation.
 */
export type GlobalMenuRouteItem = GlobalMenuItemBase & {
  /**
   * Route path to navigate to
   */
  to: string;
  /**
   * Optional onClick handler for side effects (e.g., closing menu, analytics)
   * Navigation happens automatically via the `to` prop
   */
  onClick?: () => void;
};

/**
 * Represents a menu item that performs an action
 */
export type GlobalMenuActionItem = GlobalMenuItemBase & {
  /**
   * Action to perform when clicked
   */
  onClick: () => void;
};

/**
 * Union type for all menu item types
 */
export type GlobalMenuItem = GlobalMenuRouteItem | GlobalMenuActionItem;

/**
 * Type guard to check if item is a route item
 *
 * @param item
 */
export const isRouteItem = (
  item: GlobalMenuItem,
): item is GlobalMenuRouteItem => {
  return 'to' in item;
};

/**
 * Represents a section in the menu
 */
export type GlobalMenuSection = {
  /**
   * Unique identifier for the section
   */
  id: string;
  /**
   * Optional section title (uppercase header)
   */
  title?: string;
  /**
   * Items in this section
   */
  items: GlobalMenuItem[];
};

/**
 * Props for the GlobalMenuList component
 */
export type GlobalMenuListProps = {
  /**
   * Sections to display in the menu
   */
  sections: GlobalMenuSection[];
  /**
   * Optional className for styling
   */
  className?: string;
};

/**
 * Props for the MenuItemContent component
 */
export type MenuItemContentProps = {
  /**
   * Label text to display
   */
  label: string;
  /**
   * Optional badge count or custom badge component
   */
  badge?: number | ReactNode;
  /**
   * Whether to show chevron icon on the right
   */
  showChevron: boolean;
  /**
   * Text color for the label
   */
  textColor: TextColor;
};
