import { AccountGroupId } from '@metamask/account-api';
import { BackgroundColor } from '../../../helpers/constants/design-system';

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
   * If not provided, falls back to BackgroundColor.backgroundMuted
   */
  buttonBackgroundColor?: BackgroundColor;

  /**
   * Optional callback for account rename action.
   */
  handleAccountRenameAction?: (accountGroupId: AccountGroupId) => void;
};
