import type { AccountGroupId } from '@metamask/account-api';

export type AddDeviceSyncRequest = {
  selectedAccountGroupIds: AccountGroupId[];
  syncedAccountCount: number;
  syncedWalletCount: number;
};
