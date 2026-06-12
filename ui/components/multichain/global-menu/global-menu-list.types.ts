import { ReactNode } from 'react';
import {
  IconName,
  IconSize,
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
   * Optional icon size
   * If not provided, defaults to Lg
   */
  iconSize?: IconSize;
  /**
   * Optional icon color (from @metamask/design-system-react)
   * If not provided, defaults to iconAlternative
   */
  iconColor?: IconColor;
  /**
   * Optional text color (from @metamask/design-system-react)
   * If not provided, uses default text color
   */
  textColor?: TextColor;
  /**
   * Label text for the menu item (can be string or ReactNode for custom content)
   */
  label: string | ReactNode;
  /**
   * Optional badge component (e.g., NotificationsTagCounter)
   * The badge component handles its own internal state/logic
   */
  badge?: ReactNode;
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
   * When true, show a chevron (>) on the right to indicate navigation
   */
  showChevron?: boolean;
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
   * Optional React Router location state (e.g. { prevPath } for back navigation)
   */
  state?: object;
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
   * When true, do not show the divider line above this section
   */
  hideDividerAbove?: boolean;
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
