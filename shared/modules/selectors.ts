import { ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS } from '../constants/smartTransactions';
import { KeyringType } from '../constants/keyring';
import { getNetworkNameByChainId } from './feature-flags';

export const getProviderConfig = (state: Record<string, any>) => {
  return state.metamask.providerConfig;
};

export const getCurrentChainId = (state: Record<string, any>): string => {
  const { chainId } = getProviderConfig(state);
  return chainId;
};

export const getSmartTransactionsOptInStatus = (
  state: Record<string, any>,
): boolean | null => {
  return state.metamask.preferences?.stxOptIn;
};

export function getSelectedInternalAccount(state: Record<string, any>) {
  const accountId = state.metamask.internalAccounts?.selectedAccount;
  if (!accountId) {
    return null;
  }
  return state.metamask.internalAccounts?.accounts[accountId];
}

export function getCurrentKeyring(state: Record<string, any>) {
  const internalAccount = getSelectedInternalAccount(state);

  if (!internalAccount) {
    return null;
  }

  return internalAccount.metadata.keyring;
}

/**
 * Checks if the current wallet is a hardware wallet.
 *
 * @param state
 * @returns
 */
export function isHardwareWallet(state: Record<string, any>): boolean {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

export function getAccountTypeForKeyring(
  keyring: { type: string } | null,
): string {
  if (!keyring) {
    return '';
  }

  const { type } = keyring;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  if (type.startsWith('Custody')) {
    return 'custody';
  }
  ///: END:ONLY_INCLUDE_IF

  switch (type) {
    case KeyringType.trezor:
    case KeyringType.ledger:
    case KeyringType.lattice:
    case KeyringType.qr:
      return 'hardware';
    case KeyringType.imported:
      return 'imported';
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case KeyringType.snap:
      return 'snap';
    ///: END:ONLY_INCLUDE_IF
    default:
      return 'default';
  }
}

export function getAccountType(state: Record<string, any>): string {
  const currentKeyring = getCurrentKeyring(state);
  return getAccountTypeForKeyring(currentKeyring);
}

/**
 * Checks if the account supports smart transactions.
 *
 * @param state - The state object.
 * @returns
 */
export function accountSupportsSmartTx(state: Record<string, any>): boolean {
  const accountType = getAccountType(state);

  return Boolean(accountType !== 'hardware' && accountType !== 'snap');
}

/**
 * Get a HW wallet type, e.g. "Ledger Hardware"
 *
 * @param state
 * @returns
 */
export function getHardwareWalletType(
  state: Record<string, any>,
): string | undefined {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state) ? keyring.type : undefined;
}

export const getIsAllowedStxChainId = (state: Record<string, any>): boolean => {
  const chainId = getCurrentChainId(state);
  return ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(chainId);
};

export const getSmartTransactionsEnabled = (
  state: Record<string, any>,
): boolean => {
  const supportedAccount = accountSupportsSmartTx(state);
  // TODO: Create a new proxy service only for MM feature flags.
  const smartTransactionsFeatureFlagEnabled =
    state.metamask.swapsState?.swapsFeatureFlags?.smartTransactions
      ?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    getIsAllowedStxChainId(state) &&
      supportedAccount &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getIsSmartTransaction = (state: Record<string, any>): boolean => {
  const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  return smartTransactionsOptInStatus && smartTransactionsEnabled;
};

export function getFeatureFlagsByChainId(state: Record<string, any>) {
  const chainId = getCurrentChainId(state);
  const networkName = getNetworkNameByChainId(chainId);
  const featureFlags = state.metamask.swapsState?.swapsFeatureFlags;
  if (!featureFlags?.[networkName]) {
    return null;
  }
  return {
    smartTransactions: {
      ...featureFlags[networkName].smartTransactions,
      ...featureFlags.smartTransactions,
    },
  };
}

const sharedSelectors = {
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getIsSmartTransaction,
  getIsAllowedStxChainId,
  getFeatureFlagsByChainId,
};

export default sharedSelectors;
