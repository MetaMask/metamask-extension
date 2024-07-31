import {
  EthAccountType,
  BtcAccountType,
  InternalAccount,
} from '@metamask/keyring-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../shared/lib/multichain';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { createDeepEqualSelector } from './util';

export type AccountsState = {
  metamask: AccountsControllerState;
};

function isBtcAccount(account: InternalAccount) {
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}

export const getInternalAccounts = createDeepEqualSelector(
  (state: AccountsState) => state.metamask.internalAccounts.accounts,
  (accounts) => Object.values(accounts),
);

export const getSelectedInternalAccount = createDeepEqualSelector(
  (state: AccountsState) => state.metamask.internalAccounts,
  (internalAccounts) => {
    const accountId = internalAccounts.selectedAccount;
    return internalAccounts.accounts[accountId];
  },
);

/**
 * Returns a memoized selector that gets the internal accounts from the Redux store.
 *
 * @param state - The Redux store state.
 * @returns {Array} An array of internal accounts.
 */
export const getMemoizedMetaMaskInternalAccounts = createDeepEqualSelector(
  getInternalAccounts,
  (internalAccounts) => internalAccounts,
);

export const getMaybeSelectedInternalAccount = createDeepEqualSelector(
  (state: AccountsState) => state.metamask.internalAccounts,
  (internalAccounts) => {
    // Same as `getSelectedInternalAccount`, but might potentially be `undefined`:
    // - This might happen during the onboarding
    const accountId = internalAccounts?.selectedAccount;
    return accountId ? internalAccounts?.accounts[accountId] : undefined;
  },
);

export function getInternalAccountByAddress(
  state: AccountsState,
  address: string,
) {
  return Object.values(state.metamask.internalAccounts.accounts).find(
    (account) => isEqualCaseInsensitive(account.address, address),
  );
}

export function getSelectedAddress(state: AccountsState) {
  return getSelectedInternalAccount(state)?.address;
}

export function getInternalAccount(state: AccountsState, accountId: string) {
  return state.metamask.internalAccounts.accounts[accountId];
}

export function getAccountName(
  accounts: InternalAccount[],
  accountAddress: string,
) {
  const account = accounts.find((internalAccount: InternalAccount) =>
    isEqualCaseInsensitive(internalAccount.address, accountAddress),
  );
  return account && account.metadata.name !== '' ? account.metadata.name : '';
}

export function isSelectedInternalAccountEth(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountBtc(state: AccountsState) {
  return isBtcAccount(getSelectedInternalAccount(state));
}

function hasCreatedBtcAccount(
  state: AccountsState,
  isAddressCallback: (address: string) => boolean,
) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account: InternalAccount) => {
    return isBtcAccount(account) && isAddressCallback(account.address);
  });
}

export function hasCreatedBtcMainnetAccount(state: AccountsState) {
  return hasCreatedBtcAccount(state, isBtcMainnetAddress);
}

export function hasCreatedBtcTestnetAccount(state: AccountsState) {
  return hasCreatedBtcAccount(state, isBtcTestnetAddress);
}
