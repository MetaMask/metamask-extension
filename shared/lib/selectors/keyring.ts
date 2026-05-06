import { KeyringType } from '../../constants/keyring';

type Keyring = { type: string } | null | undefined;

// Structurally minimal state shape for keyring-derived helpers. Only requires
// the path actually read (`...metadata?.keyring?.type`), so any state that
// includes the selected internal account's keyring type — full
// `AccountsControllerState`-typed UI state, or the custom subset declared by
// `SmartTransactionsMetaMaskState` — is assignable without a cast.
export type KeyringSelectorState = {
  metamask: {
    internalAccounts: {
      selectedAccount: string;
      accounts: Record<string, { metadata?: { keyring?: { type?: string } } }>;
    };
  };
};

export function getCurrentKeyring(state: KeyringSelectorState): Keyring {
  const accountId = state.metamask.internalAccounts.selectedAccount;
  const account = state.metamask.internalAccounts.accounts[accountId];
  if (!account?.metadata?.keyring?.type) {
    return null;
  }
  return { type: account.metadata.keyring.type };
}

export function isHardwareWallet(state: KeyringSelectorState): boolean {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

/**
 * Get a HW wallet type, e.g. "Ledger Hardware"
 *
 * @param state - The state object.
 */
export function getHardwareWalletType(
  state: KeyringSelectorState,
): string | undefined {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state) ? keyring?.type : undefined;
}

export function getAccountTypeForKeyring(keyring: Keyring): string {
  if (!keyring) {
    return '';
  }

  switch (keyring.type) {
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

export function getAccountType(state: KeyringSelectorState): string {
  const currentKeyring = getCurrentKeyring(state);
  return getAccountTypeForKeyring(currentKeyring);
}

/**
 * Checks if the account supports smart transactions.
 *
 * @param state - The state object.
 */
export function accountSupportsSmartTx(state: KeyringSelectorState): boolean {
  const accountType = getAccountType(state);
  return Boolean(accountType !== 'snap');
}
