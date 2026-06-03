import { AccountGroupId } from '@metamask/account-api';
import { BoxBackgroundColor } from '@metamask/design-system-shared';

export type MultichainAccountMenuProps = {
  /**
   * ID of an account group.
   */
  accountGroupId: AccountGroupId;

  /**
   * Whether the account is removable.
   */
  isRemovable: boolean;

  /**
   * Optional background color for the menu button.
   * If not provided, falls back to BoxBackgroundColor.BackgroundMuted
   */
  buttonBackgroundColor?: BoxBackgroundColor;

  /**
   * Optional callback for account rename action.
   */
  handleAccountRenameAction?: (accountGroupId: AccountGroupId) => void;

  /**
   * Whether the menu popover is open.
   */
  isOpen?: boolean;

  /**
   * Callback to toggle the menu popover open/closed state.
   */
  onToggle?: () => void;
};
