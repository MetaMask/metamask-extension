import {
  EthAccountType,
  BtcAccountType,
  InternalAccount,
} from '@metamask/keyring-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { getSelectedInternalAccount, getInternalAccounts } from './selectors';
import { isBtcMainnetAddress } from '../../shared/lib/multichain';

export type AccountsState = {
  metamask: AccountsControllerState;
};

function isBtcAccount(account: InternalAccount) {
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}

export function isSelectedInternalAccountEth(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountBtc(state: AccountsState) {
  return isBtcAccount(getSelectedInternalAccount(state));
}

export function hasCreatedBtcMainnetAccount(state: AccountsState) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => {
    // Since we might wanna support testnet accounts later, we do
    // want to make this one very explicit and check for mainnet addresses!
    return isBtcAccount(account) && isBtcMainnetAddress(account.address);
  });
}
