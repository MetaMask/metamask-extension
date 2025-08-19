import { AccountGroupId } from '@metamask/account-api';
import {
  AccountTreeState,
  InternalAccountsState,
  MultichainAccountsState,
} from './account-tree.types';

// Helper function to create properly typed mock state
export const createMockMultichainAccountsState = (
  accountTree: AccountTreeState,
  internalAccounts: InternalAccountsState,
): MultichainAccountsState => ({
  metamask: {
    accountTree,
    internalAccounts,
  },
});

// Helper function to create empty state
export const createEmptyState = (): MultichainAccountsState =>
  createMockMultichainAccountsState(
    {
      wallets: {},
      selectedAccountGroup: null as unknown as AccountGroupId,
    },
    {
      accounts: {},
      selectedAccount: '',
    },
  );
