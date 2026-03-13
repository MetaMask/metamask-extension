/**
 * Minimal accessor for current keyring from MetaMask state.
 * No UI imports - only reads state shape to break shared→ui cycle.
 */

type InternalAccountsState = {
  metamask?: {
    internalAccounts?: {
      selectedAccount?: string;
      accounts?: Record<string, { metadata?: { keyring?: { type?: string } } }>;
    };
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
