import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import type {
  AccountGroupObject,
  AccountWalletObject,
} from '@metamask/account-tree-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountId } from '@metamask/accounts-controller';
import { CaipAccountId, CaipChainId } from '@metamask/keyring-api';
import { MergedInternalAccount } from '../selectors.types';

export type WalletMetadata = {
  id: string;
  name: string;
};

export type AccountTreeWallets = {
  [walletId: AccountWalletId]: AccountWalletObject;
};

export type AccountTreeState = {
  wallets: AccountTreeWallets;
  selectedAccountGroup: AccountGroupId;
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
  id: AccountGroupObject['id'];
  type: AccountGroupObject['type'];
  metadata: AccountGroupObject['metadata'];
  accounts: MergedInternalAccount[];
};

export type ConsolidatedAccountWallet = {
  id: AccountWalletObject['id'];
  type: AccountWalletObject['type'];
  metadata: AccountWalletObject['metadata'];
  groups: {
    [groupId: AccountGroupId]: ConsolidatedAccountGroup;
  };
};

export type ConsolidatedWallets = {
  [walletId: AccountWalletId]: ConsolidatedAccountWallet;
};

export type MultichainAccountId = AccountGroupObject['id'];
export type MultichainAccountGroupToScopesMap = Map<
  MultichainAccountId,
  MultichainAccountGroupScopeToCaipAccountId
>;
export type MultichainAccountGroupScopeToCaipAccountId = Map<
  CaipChainId,
  CaipAccountId
>;

export type AccountGroupWithInternalAccounts = {
  [K in keyof AccountGroupObject]: K extends 'accounts'
    ? InternalAccount[]
    : AccountGroupObject[K];
};
