import type {
  AccountGroupId,
  AccountWalletId,
  AccountGroupMetadata,
  AccountWalletMetadata,
  AccountWallet,
} from '@metamask/account-tree-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountId } from '@metamask/accounts-controller';
import { MergedInternalAccount } from '../selectors.types';

export type AccountTreeState = {
  wallets: {
    [walletId: AccountWalletId]: AccountWallet;
  };
};

export type InternalAccountsState = {
  accounts: Record<AccountId, InternalAccount>;
  selectedAccount: string;
};

export type MultichainAccountsState = {
  metamask: {
    accountTree: AccountTreeState;
    internalAccounts: InternalAccountsState;
  };
};

export type ConsolidatedAccountGroup = {
  id: AccountGroupId;
  metadata: AccountGroupMetadata;
  accounts: MergedInternalAccount[];
};

export type ConsolidatedAccountWallet = {
  id: AccountWalletId;
  metadata: AccountWalletMetadata;
  groups: {
    [groupId: AccountGroupId]: ConsolidatedAccountGroup;
  };
};

export type ConsolidatedWallets = {
  [walletId: AccountWalletId]: ConsolidatedAccountWallet;
};
