import type { AccountGroupId } from '@metamask/account-api';

export type AddDeviceSyncRequest = {
  selectedAccountGroupIds: AccountGroupId[];
  selectedAccountGroupCounts: Partial<Record<AccountGroupId, number>>;
  syncedAccountCount: number;
  syncedWalletCount: number;
};
