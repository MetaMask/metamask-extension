import { KeyringType } from '../../constants/keyring';
import { AccountsState, getSelectedInternalAccount } from './accounts';

type Keyring = { type: string };

export function getCurrentKeyring(state: AccountsState) {
  const internalAccount = getSelectedInternalAccount(state);

  if (!internalAccount) {
    return null;
  }

  return internalAccount.metadata?.keyring;
}

export function isHardwareWallet(state: AccountsState): boolean {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

/**
 * Get a HW wallet type, e.g. "Ledger Hardware"
 *
 * @param state - The state object.
 */
export function getHardwareWalletType(
  state: AccountsState,
): string | undefined {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state) ? keyring?.type : undefined;
}

export function getAccountType(state: AccountsState): string {
  const currentKeyring = getCurrentKeyring(state);
  return getAccountTypeForKeyring(currentKeyring);
}

export function getAccountTypeForKeyring(
  keyring: Keyring | null | undefined,
): string {
  if (!keyring) {
    return '';
  }

  const { type } = keyring;

  switch (type) {
    case KeyringType.trezor:
    case KeyringType.oneKey:
    case KeyringType.ledger:
    case KeyringType.lattice:
    case KeyringType.qr:
      return 'hardware';
    case KeyringType.imported:
      return 'imported';
    case KeyringType.snap:
      return 'snap';
    default:
      return 'default';
  }
}

/**
 * Checks if the account supports smart transactions.
 *
 * @param state - The state object.
 */
export function accountSupportsSmartTx(state: AccountsState): boolean {
  const accountType = getAccountType(state);
  return Boolean(accountType !== 'snap');
}
