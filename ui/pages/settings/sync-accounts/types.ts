import type { AccountGroupId } from '@metamask/account-api';

export type AddDeviceSyncRequest = {
  selectedAccountGroupIds: AccountGroupId[];
  selectedAccountGroupCounts: Partial<Record<AccountGroupId, number>>;
  importSummary: {
    wallets: {
      id: string;
      name: string;
      accounts: {
        id: string;
        name: string;
      }[];
    }[];
  };
  syncedAccountCount: number;
  syncedWalletCount: number;
};
