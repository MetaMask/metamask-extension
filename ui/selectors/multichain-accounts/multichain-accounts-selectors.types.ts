import type {
  AccountGroupId,
  AccountWalletId,
  AccountGroupMetadata,
  AccountWalletMetadata,
  AccountWallet,
} from '@metamask/account-tree-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { InternalAccountWithBalance } from '../selectors.types';

export type AccountTreeState = {
  wallets: {
    [walletId: string]: AccountWallet;
  };
};

export type InternalAccountsState = {
  accounts: Record<string, InternalAccount>;
  selectedAccount: string;
};

export type MultichainAccountsState = {
  metamask: {
    accountTree: AccountTreeState;
    internalAccounts: InternalAccountsState;
  };
};

type ConsolidatedAccountGroup = {
  id: AccountGroupId;
  metadata: AccountGroupMetadata;
  accounts: InternalAccountWithBalance[];
};

type ConsolidatedAccountWallet = {
  id: AccountWalletId;
  metadata: AccountWalletMetadata;
  groups: {
    [groupId: string]: ConsolidatedAccountGroup;
  };
};

export type ConsolidatedWallets = {
  [walletId: string]: ConsolidatedAccountWallet;
};
