import {
  EthAccountType,
  BtcAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { createSelector } from 'reselect';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';

export type AccountsState = {
  metamask: AccountsControllerState;
};

export function isSolanaAccount(account: InternalAccount) {
  const { DataAccount } = SolAccountType;

  return Boolean(account && account.type === DataAccount);
}

export function isNonEvmAccount(account: InternalAccount) {
  const { DataAccount } = SolAccountType;

  return Boolean(
    account &&
      (Object.values(BtcAccountType).includes(account.type as BtcAccountType) ||
        account.type === DataAccount),
  );
}

export const getInternalAccounts = createSelector(
  (state: AccountsState) =>
    Object.values(state.metamask.internalAccounts.accounts),
  (accounts) => accounts,
);

export const getMemoizedInternalAccountByAddress = createDeepEqualSelector(
  [getInternalAccounts, (_state, address) => address],
  (internalAccounts, address) => {
    return internalAccounts.find((account) =>
      isEqualCaseInsensitive(account.address, address),
    );
  },
);

export function getSelectedInternalAccount(state: AccountsState) {
  const accountId = state.metamask.internalAccounts.selectedAccount;
  return state.metamask.internalAccounts.accounts[accountId];
}

export function isSelectedInternalAccountEth(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountSolana(state: AccountsState) {
  return isSolanaAccount(getSelectedInternalAccount(state));
}

export function hasCreatedSolanaAccount(state: AccountsState) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => isSolanaAccount(account));
}
