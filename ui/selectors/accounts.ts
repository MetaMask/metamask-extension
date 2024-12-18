import {
  EthAccountType,
  BtcAccountType,
  InternalAccount,
} from '@metamask/keyring-api';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../shared/lib/multichain';
import { MetaMaskReduxState } from '../store/store';

function isBtcAccount(account: InternalAccount) {
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}

export function getInternalAccounts(state: MetaMaskReduxState) {
  return Object.values(
    state.metamask.AccountsController.internalAccounts.accounts,
  );
}

export function getSelectedInternalAccount(state: MetaMaskReduxState) {
  const accountId =
    state.metamask.AccountsController.internalAccounts.selectedAccount;
  return state.metamask.AccountsController.internalAccounts.accounts[accountId];
}

export function isSelectedInternalAccountEth(state: MetaMaskReduxState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountBtc(state: MetaMaskReduxState) {
  return isBtcAccount(getSelectedInternalAccount(state));
}

function hasCreatedBtcAccount(
  state: MetaMaskReduxState,
  isAddressCallback: (address: string) => boolean,
) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => {
    return isBtcAccount(account) && isAddressCallback(account.address);
  });
}

export function hasCreatedBtcMainnetAccount(state: MetaMaskReduxState) {
  return hasCreatedBtcAccount(state, isBtcMainnetAddress);
}

export function hasCreatedBtcTestnetAccount(state: MetaMaskReduxState) {
  return hasCreatedBtcAccount(state, isBtcTestnetAddress);
}
