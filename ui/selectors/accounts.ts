import {
  EthAccountType,
  BtcAccountType,
  InternalAccount,
} from '@metamask/keyring-api';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../shared/lib/multichain';
import { MetaMaskSliceControllerState } from '../ducks/metamask/metamask';

export type AccountsMetaMaskState =
  MetaMaskSliceControllerState<'AccountsController'>;

function isBtcAccount(account: InternalAccount) {
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}

export function getInternalAccounts(state: AccountsMetaMaskState) {
  return Object.values(
    state.metamask.AccountsController.internalAccounts.accounts,
  );
}

export function getSelectedInternalAccount(state: AccountsMetaMaskState) {
  const accountId =
    state.metamask.AccountsController.internalAccounts.selectedAccount;
  return state.metamask.AccountsController.internalAccounts.accounts[accountId];
}

export function isSelectedInternalAccountEth(state: AccountsMetaMaskState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountBtc(state: AccountsMetaMaskState) {
  return isBtcAccount(getSelectedInternalAccount(state));
}

function hasCreatedBtcAccount(
  state: AccountsMetaMaskState,
  isAddressCallback: (address: string) => boolean,
) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => {
    return isBtcAccount(account) && isAddressCallback(account.address);
  });
}

export function hasCreatedBtcMainnetAccount(state: AccountsMetaMaskState) {
  return hasCreatedBtcAccount(state, isBtcMainnetAddress);
}

export function hasCreatedBtcTestnetAccount(state: AccountsMetaMaskState) {
  return hasCreatedBtcAccount(state, isBtcTestnetAddress);
}
