import { EthAccountType, BtcAccountType } from '@metamask/keyring-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { getSelectedInternalAccount } from './selectors';

export type AccountsState = {
  metamask: AccountsControllerState;
};

export function isSelectedInternalAccountEth(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountBtc(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}
