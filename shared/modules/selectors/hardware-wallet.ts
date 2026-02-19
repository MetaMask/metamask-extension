import {
  getSelectedInternalAccount,
  type SelectedInternalAccountState,
} from './accounts';

export function getCurrentKeyring(state: SelectedInternalAccountState) {
  const internalAccount = getSelectedInternalAccount(state);

  if (!internalAccount) {
    return null;
  }

  return internalAccount.metadata?.keyring;
}

export function isHardwareWallet(state: SelectedInternalAccountState) {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

export function getHardwareWalletType(state: SelectedInternalAccountState) {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state)
    ? (keyring as { type: string }).type
    : undefined;
}
