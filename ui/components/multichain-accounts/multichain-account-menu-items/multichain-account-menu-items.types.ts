import type { MouseEventHandler } from 'react';
import type { IconName, TextColor } from '@metamask/design-system-react';

export type MultichainAccountMenuItemsProps = {
  /**
   * Configuration array for menu items.
   */
  menuConfig: MenuItemConfig[];
};

export type MenuItemConfig = {
  /**
   * Translation key for the menu item text.
   */
  textKey: string;

  /**
   * Icon to display for the menu item.
   */
  iconName: IconName;

  /**
   * Function to execute when the menu item is clicked.
   */
  onClick: MouseEventHandler<HTMLDivElement>;

  /**
   * Optional color for the menu item text.
   */
  textColor?: TextColor;

  /**
   * Whether the menu item is disabled.
   */
  disabled?: boolean;
};
