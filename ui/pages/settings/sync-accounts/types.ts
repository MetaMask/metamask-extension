import type { AccountGroupId } from '@metamask/account-api';

export type SyncImportSummary = {
  wallets: {
    id: string;
    name: string;
    accounts: {
      id: string;
      name: string;
    }[];
  }[];
};

export type AddDeviceSyncRequest = {
  selectedAccountGroupIds: AccountGroupId[];
  importSummary?: SyncImportSummary;
  syncedAccountCount: number;
  syncedWalletCount: number;
};
