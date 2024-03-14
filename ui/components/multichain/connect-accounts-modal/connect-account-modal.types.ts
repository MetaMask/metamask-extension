import { type InternalAccount } from '@metamask/keyring-api';

export enum ConnectAccountsType {
  Account = 'disconnectAllAccountsText',
  Snap = 'disconnectAllSnapsText',
}

export type AccountType = InternalAccount & {
  name: string;
  address: string;
  balance: string;
  keyring: KeyringType;
  label?: string;
};

export type KeyringType = {
  type: string;
};

export type ConnectAccountsListProps = {
  onClose: () => void;
  allAreSelected: () => boolean;
  deselectAll: () => void;
  selectAll: () => void;
  handleAccountClick: (address: string) => void;
  selectedAccounts: string[];
  accounts: AccountType[];
  checked: boolean;
  isIndeterminate: boolean;
};
