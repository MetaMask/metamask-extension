import {
  EthAccountType,
  BtcAccountType,
  InternalAccount,
} from '@metamask/keyring-api';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../shared/lib/multichain';
import type { BackgroundStateProxy } from '../../shared/types/metamask';
import { MultichainState } from './multichain';

export type AccountsState = {
  metamask: Pick<BackgroundStateProxy, 'AccountsController'>;
};

export type MultichainAccountsState = MultichainState & {
  metamask: Pick<
    BackgroundStateProxy,
    | 'AccountTracker'
    | 'OnboardingController'
    | 'PermissionController'
    | 'SubjectMetadataController'
    | 'SnapController'
    | 'PreferencesController'
  >;
};

function isBtcAccount(account: InternalAccount) {
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}

export function getInternalAccounts(state: MultichainAccountsState) {
  return Object.values(
    state.metamask.AccountsController.internalAccounts.accounts,
  );
}

export function getSelectedInternalAccount(state: AccountsState) {
  const accountId =
    state.metamask.AccountsController.internalAccounts.selectedAccount;
  return state.metamask.AccountsController.internalAccounts.accounts[accountId];
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
  state: MultichainAccountsState,
  isAddressCallback: (address: string) => boolean,
) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => {
    return isBtcAccount(account) && isAddressCallback(account.address);
  });
}

export function hasCreatedBtcMainnetAccount(state: MultichainAccountsState) {
  return hasCreatedBtcAccount(state, isBtcMainnetAddress);
}

export function hasCreatedBtcTestnetAccount(state: MultichainAccountsState) {
  return hasCreatedBtcAccount(state, isBtcTestnetAddress);
}
