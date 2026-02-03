import { ReactNode } from 'react';
import { IconName } from '../../component-library';
import { IconColor, TextColor } from '../../../helpers/constants/design-system';

/**
 * Represents a menu item that navigates to a route
 */
export type GlobalMenuRouteItem = {
  /**
   * Unique identifier for the route item
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
   * Route path to navigate to
   */
  to: string;
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
  /**
   * Optional onClick handler
   */
  onClick?: () => void;
};

/**
 * Represents a menu item that performs an action
 */
export type GlobalMenuActionItem = {
  /**
   * Unique identifier for the action item
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
   * Optional section title (uppercase header)
   */
  title?: string;
  /**
   * Items in this section
   */
  items: GlobalMenuItem[];
};
