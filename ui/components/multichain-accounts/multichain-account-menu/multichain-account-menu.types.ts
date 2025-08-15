import { AccountGroupId } from '@metamask/account-api';

export type MultichainAccountMenuProps = {
  /**
   * ID of an account group.
   */
  accountGroupId: AccountGroupId;

  /**
   * Whether the account is removable.
   */
  isRemovable: boolean;
};
