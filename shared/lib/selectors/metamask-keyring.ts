import { KeyringTypes } from '@metamask/keyring-controller';

/**
 * Minimal accessors for MetaMask state.
 * No UI imports - only reads state shape to break shared→ui cycle.
 */

type InternalAccountsState = {
  metamask?: {
    internalAccounts?: {
      selectedAccount?: string;
      accounts?: Record<string, { metadata?: { keyring?: { type?: string } } }>;
    };
    preferences?: Record<string, unknown>;
  };
};

/**
 * Returns the keyring for the currently selected internal account.
 * Uses minimal state shape to avoid depending on ui/selectors.
 *
 * @param state - Redux state with metamask.internalAccounts
 * @returns keyring object or null
 */
export function getCurrentKeyringFromState(
  state: InternalAccountsState,
): { type?: string } | null {
  const selectedAccount = state.metamask?.internalAccounts?.selectedAccount;
  const accounts = state.metamask?.internalAccounts?.accounts;
  if (!selectedAccount || !accounts) {
    return null;
  }
  const account = accounts[selectedAccount];
  return account?.metadata?.keyring ?? null;
}

/**
 * Returns metamask preferences. Used by smart-transactions to avoid ui import.
 */
export function getPreferences(state: InternalAccountsState): Record<string, unknown> {
  return state.metamask?.preferences ?? {};
}

/**
 * Returns true if the current account supports smart transactions (not a snap account).
 * Used by smart-transactions to avoid ui import.
 */
export function accountSupportsSmartTx(state: InternalAccountsState): boolean {
  const keyring = getCurrentKeyringFromState(state);
  return keyring?.type !== KeyringTypes.snap;
}
